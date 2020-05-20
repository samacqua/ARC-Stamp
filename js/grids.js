class Grid {
    constructor(height, width, values) {
        // console.log(values);
        this.height = height;
        this.width = width;
        this.grid = new Array(height);
        for (var i = 0; i < height; i++){
            this.grid[i] = new Array(width);
            for (var j = 0; j < width; j++){
                if (values != undefined && values[i] != undefined && values[i][j] != undefined){
                    this.grid[i][j] = values[i][j];
                } else {
                    this.grid[i][j] = 0;
                }
            }
        }
    }
}

// Internal state.
var CURRENT_INPUT_GRID = new Grid(3, 3);
var CURRENT_OUTPUT_GRID = new Grid(3, 3);
var TEST_PAIRS = new Array();
var CURRENT_TEST_PAIR_INDEX = 0;
var COPY_PASTE_DATA = new Array();

// Cosmetic.
var EDITION_GRID_HEIGHT = 500;
var EDITION_GRID_WIDTH = 500;
var MAX_CELL_SIZE = 100;

function grid_equal(grid1, grid2){
    if (grid1.height != grid2.height || grid1.width != grid2.width) {
        return false;
    }
    for (var i = 0; i < grid1.height; i++){
        for (var j = 0; j < grid1.width; j++){
            if (grid1.grid[i][j] != grid2.grid[i][j]){
                return [i,j];
            }
        }
    }
    return true;
}

function wipe_grid(grid) {
    for (var i = 0; i < grid.height; i++) {
        for (var j = 0; j < grid.width; j++) {
            grid.grid[i][j] = 0;
        }
    }
}

function transparent_grid(height, width) {
    var xx = [];
    for (var i = 0; i < height; i++){
        var yy = [];
        for (var j = 0; j < width; j++){
            yy.push(10);
        }
        xx.push(yy);
    }
    return new Grid(height, width, xx);
}

function blank_grid_like(grid){
    return new Grid(grid.height, grid.width, undefined);
}

function refreshEditionGrid(jqGrid, dataGrid) {
    fillJqGridWithData(jqGrid, dataGrid);
    setUpEditionGridListeners(jqGrid);
    fitCellsToContainer(jqGrid, dataGrid.height, dataGrid.width, EDITION_GRID_HEIGHT, EDITION_GRID_WIDTH);
    initializeSelectable();
}

function syncFromEditionGridToDataGrid() {
    copyJqGridToDataGrid($('#output_grid .edition_grid'), CURRENT_OUTPUT_GRID);
}

function syncFromDataGridToEditionGrid() {
    refreshEditionGrid($('#output_grid .edition_grid'), CURRENT_OUTPUT_GRID);
}

function convertSerializedGridToGridObject(values) {
    height = values.length;
    width = values[0].length;
    return new Grid(height, width, values)
}

function fillJqGridWithData(jqGrid, dataGrid) {
    jqGrid.empty();
    height = dataGrid.height;
    width = dataGrid.width;
    for (var i = 0; i < height; i++){
        var row = $(document.createElement('div'));
        row.addClass('row');
        for (var j = 0; j < width; j++){
            var cell = $(document.createElement('div'));
            cell.addClass('cell');
            cell.addClass(`x_${i}`);
            cell.addClass(`y_${j}`);
            cell.attr('x', i);
            cell.attr('y', j);
            setCellSymbol(cell, dataGrid.grid[i][j]);
            row.append(cell);
        }
        jqGrid.append(row);
    }
}

function copyJqGridToDataGrid(jqGrid, dataGrid) {
    row_count = jqGrid.find('.row').length
    if (dataGrid.height != row_count) {
        return
    }
    col_count = jqGrid.find('.cell').length / row_count
    if (dataGrid.width != col_count) {
        return
    }
    jqGrid.find('.row').each(function(i, row) {
        $(row).find('.cell').each(function(j, cell) {
            dataGrid.grid[i][j] = parseInt($(cell).attr('symbol'));
        });
    });
}

function setUpEditionGridListeners(jqGrid) {
    jqGrid.find('.cell').click(function(event) {
        cell = $(event.target);
        symbol = getSelectedSymbol();
        console.log(symbol);
        mode = $('input[name=tool_switching]:checked').val();
        
        
        if (mode == 'floodfill') {
            // If floodfill: fill all connected cells.
            syncFromEditionGridToDataGrid();
            grid = CURRENT_OUTPUT_GRID.grid;
            floodfillFromLocation(grid, cell, symbol);
            syncFromDataGridToEditionGrid();
        }
        else if (mode == 'edit') {
            // Else: fill just this cell.
            console.log(cell.attr('x'));
            setCellSymbol(cell, symbol, true);
        }

        // each time we click we re-synch all the stamps
        for (var stamp_idx = 0; stamp_idx < STAMPS.length; stamp_idx++) {
            copyJqGridToDataGrid($(`#stamp_${stamp_idx}`), STAMPS[stamp_idx]);
        }

    });
}

function setUpReconstructionGridListeners(jqGrid) {
    const parent_id = jqGrid.attr("id");
    const example_id = parseInt(parent_id.split("_")[1]);
    const io_str = parent_id.split("_")[0];
    const io_id = parent_id.includes("input") ? 0 : 1;

    jqGrid.find('.cell').click(function(event) {
        let cell = $(event.target);
        let x = parseInt(cell.attr("x"));
        let y = parseInt(cell.attr("y"));
        console.log(parent_id, x, y);
        // each action item is (example_id[example0, example1, etc], io_id[0 is input, 1 is output], x, y, stamp_id)
        // the jquery grid has y and x flipped like a n00b
        ACTION_SEQUENCE.push([example_id, io_id, y, x, CUR_STAMP]);
        run_action_sequence();
    });

    // set up high-light of corresponding cell
    jqGrid.find('.cell').hover(function(event) {
        let cell = $(event.target);
        cell.css("border-color", "white");
        let x = parseInt(cell.attr("x"));
        let y = parseInt(cell.attr("y"));
        $(`#pair_preview_${example_id} .${io_str}_preview .cell`).filter(`.x_${x}`).filter(`.y_${y}`).css("border-color", "white");
    }, function(event) {
        let cell = $(event.target);
        cell.css("border-color", "#555");
        let x = parseInt(cell.attr("x"));
        let y = parseInt(cell.attr("y"));
        $(`#pair_preview_${example_id} .${io_str}_preview .cell`).filter(`.x_${x}`).filter(`.y_${y}`).css("border-color", "#555");
    });

}

function resetOutputGrid() {
    syncFromEditionGridToDataGrid();
    CURRENT_OUTPUT_GRID = new Grid(3, 3);
    syncFromDataGridToEditionGrid();
}

function parseSizeTuple(size) {
    size = size.split('x');
    if (size.length != 2) {
        alert('Grid size should have the format "3x3", "5x7", etc.');
        return;
    }
    if ((size[0] < 1) || (size[1] < 1)) {
        alert('Grid size should be at least 1. Cannot have a grid with no cells.');
        return;
    }
    if ((size[0] > 30) || (size[1] > 30)) {
        alert('Grid size should be at most 30 per side. Pick a smaller size.');
        return;
    }
    return size;
}

function fitCellsToContainer(jqGrid, height, width, containerHeight, containerWidth) {
    candidate_height = Math.floor((containerHeight - height) / height);
    candidate_width = Math.floor((containerWidth - width) / width);
    size = Math.min(candidate_height, candidate_width);
    size = Math.min(MAX_CELL_SIZE, size);
    jqGrid.find('.cell').css('height', size + 'px');
    jqGrid.find('.cell').css('width', size + 'px');
}

function errorMsg(msg) {
    $('#error_display').stop(true, true);
    $('#info_display').stop(true, true);

    $('#error_display').hide();
    $('#info_display').hide();
    $('#error_display').html(msg);
    $('#error_display').show();
    $('#error_display').fadeOut(5000);
}

function infoMsg(msg) {
    $('#error_display').stop(true, true);
    $('#info_display').stop(true, true);

    $('#info_display').hide();
    $('#error_display').hide();
    $('#info_display').html(msg);
    $('#info_display').show();
    $('#info_display').fadeOut(5000);
}

function initializeSelectable() {
    try {
        $('.selectable_grid').selectable('destroy');
    }
    catch (e) {
        console.log("Issue invoking the selectable destroy method")
    }
    toolMode = $('input[name=tool_switching]:checked').val();
    if (toolMode == 'select') {
        infoMsg('Select some cells and click on a color to fill in, or press C to copy');
        
        $('.selectable_grid').selectable(
            {
                autoRefresh: false,
                filter: '> .row > .cell',
                start: function(event, ui) {
                    $('.ui-selected').each(function(i, e) {
                        console.log(i + ":" + e);
                        $(e).removeClass('ui-selected');
                    });
                }
            }
        );
    }
}