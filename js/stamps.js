// Evan internal state
var CUR_STAMP = 0;
var TARGETS = {};
var REC = {};
var STAMPS = [];
var TASK_NAME = "";

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
function floodfillFromLocation(grid, cell, symbol) {
    console.log("grid : " + grid);

    let current_stamp = STAMPS[CUR_STAMP];

    i = parseInt(cell.attr('x'));
    j = parseInt(cell.attr('y'));
    symbol = parseInt(symbol);

    grid = current_stamp.grid

    target = grid[i][j];
    
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

function add_stamp() {

    // make the stamp =======

    // step 1 : add a blank stamp of the right size to the canvas
    let size = parseSizeTuple($('#stamp_size').val());
    let height = size[0];
    let width = size[1];
    let blank_grid = transparent_grid(height, width);
    STAMPS.push(blank_grid);
    CUR_STAMP = STAMPS.length - 1;
    // step 2 : re-render all the stamps
    render_stamps();
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

function recolor_stamp() {
    let current_stamp = STAMPS[CUR_STAMP];
    for (var ii = 0; ii < current_stamp.height; ii++) {
        for (var jj = 0; jj < current_stamp.width; jj++) {
            if (current_stamp.grid[ii][jj] != 10) {
                current_stamp.grid[ii][jj] = (current_stamp.grid[ii][jj] + 1 ) % 10;
            }
        }
    }
    render_stamps();
}

function scale_stamp_up() {
    let current_stamp = STAMPS[CUR_STAMP];
    og_height = current_stamp.height;
    og_width = current_stamp.width;

    let height = og_height*2;
    let width = og_width*2;

    let new_grid = transparent_grid(height, width);

    for (var ii = 0; ii < og_height; ii++) {
        for (var jj = 0; jj < og_width; jj++) {
            new_grid.grid[ii*2][jj*2] = current_stamp.grid[ii][jj]
            new_grid.grid[ii*2+1][jj*2] = current_stamp.grid[ii][jj]
            new_grid.grid[ii*2][jj*2+1] = current_stamp.grid[ii][jj]
            new_grid.grid[ii*2+1][jj*2+1] = current_stamp.grid[ii][jj]
        }
    }

    STAMPS[CUR_STAMP] = new_grid;
    render_stamps();
}

function scale_stamp_down() {
    let current_stamp = STAMPS[CUR_STAMP];
    og_height = current_stamp.height;
    og_width = current_stamp.width;

    let height = Math.floor(og_height/2);
    let width = Math.floor(og_width/2);

    let new_grid = transparent_grid(height, width);

    for (var ii = 0; ii < height; ii++) {
        for (var jj = 0; jj < width; jj++) {
            new_grid.grid[ii][jj] = (current_stamp.grid[ii*2][jj*2]);
        }
    }

    STAMPS[CUR_STAMP] = new_grid;
    render_stamps();
}

function remove_stamp() {
    STAMPS.splice(CUR_STAMP, 1);
    CUR_STAMP = STAMPS.length - 1;
    render_stamps();
}