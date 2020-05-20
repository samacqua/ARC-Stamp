// Evan internal state
var CUR_STAMP = 0;
var TARGETS = {};
var REC = {};
var STAMPS = [];
var TASK_NAME = "";

function add_stamp() {
    // make the stamp =======

    // step 1 : add a blank stamp of the right size to the canvas
    let size = parseSizeTuple($('#stamp_size').val());
    let height = size[1];
    let width = size[0];
    let blank_grid = transparent_grid(height, width);
    STAMPS.push(blank_grid);
    CUR_STAMP = STAMPS.length - 1;
    // step 2 : re-render all the stamps
    render_stamps();
}

function render_stamp(stamp_id, stamp_grid) {
    let height = stamp_grid.height;
    let width = stamp_grid.width;
    var new_stamp = $('<div id="stamp_' + stamp_id + '" class="selectable_grid" index="' + stamp_id + `">stamp ${stamp_id}</div>`);

    refreshEditionGrid(new_stamp, stamp_grid);
    let show_stamp_size = Math.min(Math.max(30*height, 30*width), 400);

    fitCellsToContainer(new_stamp, height, width, show_stamp_size, show_stamp_size);

    // make the use stamp button ========
    var new_stamp_use = $(`<button id="stamp_use_${stamp_id}" class="use_stamp_button">use stamp ${stamp_id}</button>`);
    new_stamp_use.click(function(event){
        CUR_STAMP = stamp_id;
    });
    if (stamp_id == CUR_STAMP) {
        new_stamp_use = $(`<button id="stamp_use_${stamp_id}" class="use_stamp_button_selected">use stamp ${stamp_id}</button>`);
    } 

    new_stamp_use.click(function(event){
        CUR_STAMP = stamp_id;
        // clear other butotn to white
        for (i=0;i<STAMPS.length;i++) {
            document.getElementById(`stamp_use_${i}`).classList.remove('use_stamp_button_selected');
            document.getElementById(`stamp_use_${i}`).classList.add('use_stamp_button');
        }
        document.getElementById(`stamp_use_${stamp_id}`).classList.remove('use_stamp_button');
        document.getElementById(`stamp_use_${stamp_id}`).classList.add('use_stamp_button_selected');
    });

    // make a container that wraps the use_stamp button and the stamp itself
    var stamp_container = $(`<div class="stamp_container"></div>`);
    new_stamp_use.appendTo(stamp_container);
    new_stamp.appendTo(stamp_container);
    
    stamp_container.appendTo('#list_of_stamps');
}

// re-render all the stamps
function render_stamps() {
    $('#list_of_stamps').html('');
    for (var ii = STAMPS.length-1; ii >= 0; ii --){
        render_stamp(ii, STAMPS[ii]);
    }
    run_action_sequence();
}

// no need to have grid param, changed way func is called, but lazy
function floodfillFromLocation(jqGrid, grid, cell, symbol) {
    console.log("grid : " + grid);

    const current_stamp = STAMPS[CUR_STAMP];

    const i = parseInt(cell.attr('x'));
    const j = parseInt(cell.attr('y'));
    symbol = parseInt(symbol);

    grid = current_stamp.grid

    const target = grid[i][j];
    
    if (target == symbol) {
        return;
    }

    function flow(i, j, symbol, target) {
        if (i >= 0 && i < grid.length && j >= 0 && j < grid[i].length) {
            if (grid[i][j] == target) {
                grid[i][j] = symbol;
                flow(i - 1, j, symbol, target);
                flow(i + 1, j, symbol, target);
                flow(i, j - 1, symbol, target);
                flow(i, j + 1, symbol, target);
            }
        }
    }
    flow(i, j, symbol, target);

    grid = convertSerializedGridToGridObject(grid)
    render_stamps();
}

function getSelectedSymbol() {
    selected = $('#symbol_picker .selected-symbol-preview')[0];
    return $(selected).attr('symbol');
}

function setCellSymbol(cell, symbol, action_sequence=false) {
    // console.log(cell['x']);
    cell.attr('symbol', symbol);
    classesToRemove = ''
    for (i = 0; i < 11; i++) {
        classesToRemove += 'symbol_' + i + ' ';
    }
    cell.removeClass(classesToRemove);
    cell.addClass('symbol_' + symbol);
    if (action_sequence) {
        run_action_sequence();
    }
}

function copy_stamp() {
    let current_stamp = STAMPS[CUR_STAMP];
    let current_stamp_again = JSON.parse(JSON.stringify(current_stamp));
    STAMPS.push(current_stamp_again);
    CUR_STAMP = STAMPS.length - 1;
    render_stamps();
}

function rotateRight(array) {
    var result = [];
    array.forEach(function (a, i, aa) {
        a.forEach(function (b, j, bb) {
            result[bb.length - j - 1] = result[bb.length - j - 1] || [];
            result[bb.length - j - 1][i] = b;
        });
    });
    return result;
}
function rotate_stamp() {
    let current_stamp = STAMPS[CUR_STAMP];
    let orig_height = current_stamp.height;
    let orig_width = current_stamp.width;
    let rot_stamp_grid = rotateRight(current_stamp.grid);
    current_stamp.height = orig_width;
    current_stamp.width = orig_height;
    current_stamp.grid = rot_stamp_grid;
    render_stamps();
}

function flip_stamp() {
    let current_stamp = STAMPS[CUR_STAMP];
    current_stamp.grid.reverse();
    render_stamps();    
}

function scale_stamp() {
    let current_stamp = STAMPS[CUR_STAMP];

    let mult = current_stamp.mult;
    og_height = current_stamp.og_height;
    og_width = current_stamp.og_height;
    new_height = og_height*mult;
    new_width = og_width*mult;

    let copy_grid = current_stamp.og_grid;

    current_stamp.height = new_height;
    current_stamp.width = new_height;

    current_stamp.grid = new Array(new_height);
    for (var i = 0; i < new_height; i++){
        current_stamp.grid[i] = new Array(new_width);
    }

    for (var i = 0; i < og_height; i++){
        for (var j = 0; j < og_width; j++){
            for (var m1=0; m1<mult;m1++) {
                for (var m2=0; m2<mult;m2++) {
                    // console.log(m1, m2);
                    console.log(i+m1, j+m2);
                    current_stamp.grid[i*mult+m1][j*mult+m2] = copy_grid[i][j];
                }
            }
        }
    }
    if (mult < 5) {
        current_stamp.mult += 1;
    } else {
        current_stamp.mult = 1;
    }
    console.log(current_stamp.grid);
    STAMPS[CUR_STAMP] = current_stamp;
    render_stamps();
}

function remove_stamp() {
    STAMPS.splice(CUR_STAMP, 1);
    CUR_STAMP = STAMPS.length - 1;
    render_stamps();
}

function copy_create_new_stamp() {
    var lowX = 100;
    var highX = -100;

    var lowY = 100;
    var highY = -100;
    for (var i=0;i<COPY_PASTE_DATA.length;i++) {
        let xVal = COPY_PASTE_DATA[i][1];
        if (xVal > highX) {
            highX = xVal;
        }
        if (xVal < lowX) {
            lowX = xVal;
        }

        let yVal = COPY_PASTE_DATA[i][0];
        if (yVal > highY) {
            highY = yVal;
        }
        if (yVal < lowY) {
            lowY = yVal;
        }
    }

    height = highY - lowY + 1;
    width = highX - lowX + 1;

    new_grid = transparent_grid(height, width);
    console.log(new_grid);

    for (var d=0;d<COPY_PASTE_DATA.length;d++) {
        x = COPY_PASTE_DATA[d][1] - lowX;
        y = COPY_PASTE_DATA[d][0] - lowY;
        val = COPY_PASTE_DATA[d][2];
        new_grid.grid[y][x] = val;
    }

    STAMPS.push(new_grid);
    CUR_STAMP = STAMPS.length - 1;
    render_stamps();
}