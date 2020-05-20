function help_modal(column) {
    console.log(column);
    switch (column) {
        case 0:
            $('#gen-modal-title').html("Task and Solution Help");
            $('#gen-modal-body').html("The 'Random Task' button loads a random ARC task. The 'Browse Tasks' button allows you to browse all ARC tasks, where you can see which ones have been stamped and which ones have not and choose any. The 'Download Stamps JSON' button downloads all the stored stamps for every task. The graph on the left is the input, the graph on the right is the output.");
            break;
        case 1:
            $('#gen-modal-title').html("Create Stamps Help");
            $('#gen-modal-body').html("In this section there are three modes. You can 'edit' which lets you color individual cells on the stamps. 'Flood fill' lets you flood fill the stamp with a color, <b>but it is bugged right now, so you can only flood fill your currently selected stamp</b>. 'Copy' lets you copy cells from the 'Task and Solution Section' and paste it into a stamp (press <strong>'v'</strong> after selecting the cell to paste into) or create a new stamp (press <strong>'n'</strong>).<br/><br/>Below this mode-selecting section, there are a list of buttons to edit stamps. 'Create' adds a new stamp of the entered size, 'remove' deletes the selected stamp, 'duplicate' creates a copy of the selected stamp, 'rotate' rotates the selected stamp counter clockwise, 'flip' flips the stamp vertically, 'scale' loops through scaling the selected stamp 1x,2x,3x,4x, and 5x. Below is a display of all created stamps. To select a stamp, press the green label above it.<br/><br/>Keep in mind that white cells represent transparent/empty, and empty stamps are still sent to the database (so delete them).");
            break;
        case 2:
            $('#gen-modal-title').html("Reconstruction Help");
            $('#gen-modal-body').html("Simply press on a cell to paste the currently selected stamp. You can use the buttons to undo stamp placements and move placed stamps with the arrow buttons. Once the input/output matches the task input/output, check and submit. If everything is correct, then you can add an annotation on how you solved the task, then submit to the database, and you are done!");
            break;
    }
    $('#myModal').modal('show');
}