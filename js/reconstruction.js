// each action item is (example_id[example0, example1, etc], io_id[0 is input, 1 is output], x, y, stamp_id)
// for example : var ACTION_SEQUENCE = [[0, 0, 2, 3, 0], [0, 1, 3, 1, 1]];
var ACTION_SEQUENCE = [];

// take rec_grid, go to x,y coordinate, apply stamp
function apply_stamp(rec_grid, x, y, stamp_grid){
    for (var yy = 0; yy < stamp_grid.height; yy++){
        for (var xx = 0; xx < stamp_grid.width; xx++){
            let stamp_loc_x = x + xx;
            let stamp_loc_y = y + yy;
            if (stamp_loc_x < rec_grid.width && stamp_loc_y < rec_grid.height) {
                if (stamp_grid.grid[yy][xx] != 10){
                    rec_grid.grid[stamp_loc_y][stamp_loc_x] = stamp_grid.grid[yy][xx];
                }
            } 
        }
    }
}

function check_reconstruction() {
    var all_reconstruct_good = true;
    Object.keys(REC).forEach(function(key) {
        let same_input = grid_equal(REC[key][0], TARGETS[key][0]);
        let same_output = grid_equal(REC[key][1], TARGETS[key][1]);
        if (same_input != true) {
            alert(`Your input for task ${parseInt(key)+1} does not match the correct output on coordinates (${[same_input[1], same_input[0]]}), where (0,0) is top left.`);
            all_reconstruct_good = false;
        }
        if (same_output != true) {
            alert(`Your output for task ${parseInt(key)+1} does not match the correct output on coordinates (${[same_input[1], same_input[0]]}), where (0,0) is top left.`);
            all_reconstruct_good = false;
        }
    });
    if (all_reconstruct_good){
        $('#submission-modal').modal('show');
    }
}

function fillPairReconstruction(pairId, inputGrid, outputGrid) {
    var inputGrid = blank_grid_like(inputGrid);
    var outputGrid = blank_grid_like(outputGrid);
    REC[pairId] = [inputGrid, outputGrid]


    var pairSlot = $('#pair_reconstruction_' + pairId);
    if (!pairSlot.length) {
        // Create HTML for pair.
        pairSlot = $('<div id="pair_reconstruction_' + pairId + '" class="pair_preview" index="' + pairId + '"></div>');
        pairSlot.appendTo('#task_reconstruction');
    }
    var jqInputGrid = pairSlot.find('.input_preview');
    if (!jqInputGrid.length) {
        jqInputGrid = $(`<div class="input_preview" id="input_${pairId}"></div>`);
        jqInputGrid.appendTo(pairSlot);
    }
    var jqOutputGrid = pairSlot.find('.output_preview');
    if (!jqOutputGrid.length) {
        jqOutputGrid = $(`<div class="output_preview" id="output_${pairId}"></div>`);
        jqOutputGrid.appendTo(pairSlot);
    }
}

function undo_stamp_placement() {
    ACTION_SEQUENCE.pop();
    run_action_sequence();
}

function run_action_sequence() {
    // wipe all the reconstruction grids blank ! 
    Object.keys(REC).forEach(function(key) {
        const inputGrid = REC[key][0];
        const outputGrid = REC[key][1];
        wipe_grid(inputGrid);
        wipe_grid(outputGrid);
    });

    // update the stamp_grid with the corresponding stamps
    for (var stamp_idx = 0; stamp_idx < STAMPS.length; stamp_idx++) {
        copyJqGridToDataGrid($(`#stamp_${stamp_idx}`), STAMPS[stamp_idx]);
    }

    // update the grid values based on action sequence
    ACTION_SEQUENCE.forEach(action => {
        let io_id = action[0];
        let in_out_id = action[1];
        let xx = action[2];
        let yy = action[3];
        let stamp_id = action[4];

        let rec_grid = REC[io_id][in_out_id];
        let stamp_grid = STAMPS[stamp_id];
        console.log(rec_grid);
        console.log(stamp_grid);
        // place stamp at x,y of rec
        apply_stamp(rec_grid, xx, yy, stamp_grid);
    });      

    $('#reconstruction_text').html(ACTION_SEQUENCE.map(a => a.join(",")).join("] p["));
    synch_reconstruction();
}

function synch_reconstruction() {
    Object.keys(REC).forEach(function(key) {
        const jqInputGrid = $(`#input_${key}`)
        const jqOutputGrid = $(`#output_${key}`)
        const inputGrid = REC[key][0];
        const outputGrid = REC[key][1];

        fillJqGridWithData(jqInputGrid, inputGrid);
        setUpReconstructionGridListeners(jqInputGrid);
        fitCellsToContainer(jqInputGrid, inputGrid.height, inputGrid.width, 200, 200);

        fillJqGridWithData(jqOutputGrid, outputGrid);
        setUpReconstructionGridListeners(jqOutputGrid);
        fitCellsToContainer(jqOutputGrid, outputGrid.height, outputGrid.width, 200, 200);
    });
}