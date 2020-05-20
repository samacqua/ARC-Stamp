// Initial event binding.

$(document).ready(function () {
    $('#symbol_picker').find('.symbol_preview').click(function(event) {
        symbol_preview = $(event.target);
        $('#symbol_picker').find('.symbol_preview').each(function(i, preview) {
            $(preview).removeClass('selected-symbol-preview');
        })
        symbol_preview.addClass('selected-symbol-preview');
    });

    $('.edition_grid').each(function(i, jqGrid) {
        setUpEditionGridListeners($(jqGrid));
    });

    $('input[type=radio][name=tool_switching]').change(function() {
        initializeSelectable();
    });

    $('body').keydown(function(event) {
        // if we are in a text input area, we do not care about the key presses, so return
        if ($(event.target).closest("textarea")[0]) {
            return;
        }
        // Copy and paste functionality.
        if (event.which == 67) {
            // Press C
            selected = $('.ui-selected');
            if (selected.length == 0) {
                return;
            }

            COPY_PASTE_DATA = [];
            for (var i = 0; i < selected.length; i ++) {
                x = parseInt($(selected[i]).attr('x'));
                y = parseInt($(selected[i]).attr('y'));
                symbol = parseInt($(selected[i]).attr('symbol'));
                COPY_PASTE_DATA.push([x, y, symbol]);
            }
            toolMode = $('input[name=tool_switching]:checked').val();
            if (toolMode == 'select') {
                infoMsg('Cells copied! Select a target cell and press V to paste at location.');
            } else if (toolMode == 'crop') {


                console.log(COPY_PASTE_DATA);
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
                render_stamps();
            }

        }
        if (event.which == 86) {
            // Press P
            if (COPY_PASTE_DATA.length == 0) {
                errorMsg('No data to paste.');
                return;
            }
            selected = $('.ui-selected');
            if (selected.length == 0) {
                errorMsg('Select a target cell on the output grid.');
                return;
            }

            jqGrid = $(selected.parent().parent()[0]);

            if (selected.length == 1) {
                targetx = parseInt(selected.attr('x'));
                targety = parseInt(selected.attr('y'));

                xs = new Array();
                ys = new Array();
                symbols = new Array();

                for (var i = 0; i < COPY_PASTE_DATA.length; i ++) {
                    xs.push(COPY_PASTE_DATA[i][0]);
                    ys.push(COPY_PASTE_DATA[i][1]);
                    symbols.push(COPY_PASTE_DATA[i][2]);
                }

                minx = Math.min(...xs);
                miny = Math.min(...ys);
                for (var i = 0; i < xs.length; i ++) {
                    x = xs[i];
                    y = ys[i];
                    symbol = symbols[i];
                    newx = x - minx + targetx;
                    newy = y - miny + targety;
                    res = jqGrid.find('[x="' + newx + '"][y="' + newy + '"] ');
                    if (res.length == 1) {
                        cell = $(res[0]);
                        setCellSymbol(cell, symbol, true);
                    }
                }
            } else {
                errorMsg('Can only paste at a specific location; only select *one* cell as paste destination.');
            }
        }
    });
    randomTask();
});

$(window).on('load',function(){
    // $('#myModal').modal('show');
});