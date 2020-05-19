
// var firebaseConfig = {
//   apiKey: "AIzaSyDz8HP0WftrMi61sncVumipTboEYaTFiqQ",
//   authDomain: "arc-labels.firebaseapp.com",
//   databaseURL: "https://arc-labels.firebaseio.com",
//   projectId: "arc-labels",
//   storageBucket: "arc-labels.appspot.com",
//   messagingSenderId: "1061311925293",
//   appId: "1:1061311925293:web:0624cb2828956364403ca4"
// };
// // Initialize Firebase
// firebase.initializeApp(firebaseConfig);
// var fbase = firebase.database();

// Your web app's Firebase configuration
var firebaseConfig = {
    apiKey: "AIzaSyC0L5_b8rV6FDZegKDf4zlGWrFcgnvnCHY",
    authDomain: "arc-stamp.firebaseapp.com",
    databaseURL: "https://arc-stamp.firebaseio.com",
    projectId: "arc-stamp",
    storageBucket: "arc-stamp.appspot.com",
    messagingSenderId: "936990547280",
    appId: "1:936990547280:web:2b459d4364f70358b4a055",
    measurementId: "G-CBXZEZFYGZ"
  };
  // Initialize Firebase
  firebase.initializeApp(firebaseConfig);
  var fbase = firebase.database();

// put stuff into database
function store_parse(problem_id, stamps, action_sequence, annotation){
  let rand_id = Math.random().toString().slice(2,8);
  let ref_loc = `arc-stamp/${problem_id}/${rand_id}`;
  console.log(ref_loc);

  var ref = fbase.ref(ref_loc);
  let to_put = {
      'stamps' : stamps.map(stamp => stamp.grid),
      'action_sequence' : action_sequence,
      'annotation' : annotation
  }
  ref.once("value", function(snapshot) {
      ref.set(to_put);
      alert(`stamp and parse of ${problem_id} stored to database`)
  });  
}

function retrieve_parse(problem_id) {
    let ref_tot = fbase.ref(`arc-stamp/${problem_id}`);
    ref_tot.on("value", function(snapshot) {
        let stats = snapshot.val();
        console.log(stats);
        if (stats == null) {
            $("#is_solved").html("This task has not been labeled yet :(");
            $("#load_stamped_btn").css("visibility", "hidden");
        } else {
            $("#is_solved").html("This task has been labeled :)");
            $("#load_stamped_btn").css("visibility", "visible");
        }
    });
}

function download_stamps() {
    let ref_loc = '/arc-stamp'
    fbase.ref(ref_loc).once('value').then(function(snapshot) {
        console.log(snapshot.val());
        json_stringed = JSON.stringify(snapshot.val());
            // create the text file as a Blob:
        var blob = new Blob([json_stringed],{type: "application/json"});
        // download the file:
        download_file(blob,"ARC-Stamps.json"); 
    });
}

function download_file(blob,name) {
    var url = URL.createObjectURL(blob),
        div = document.createElement("div"),
        anch = document.createElement("a");
    document.body.appendChild(div);
    div.appendChild(anch);
    anch.innerHTML = "&nbsp;";
    div.style.width = "0";
    div.style.height = "0";
    anch.href = url;
    anch.download = name;
    
    var ev = new MouseEvent("click",{});
    anch.dispatchEvent(ev);
    document.body.removeChild(div);
}

function is_stamped(task_id) {
    // let ref_loc = '/arc-stamp'
    // fbase.ref(ref_loc).once('value').then(function(snapshot) {
    //     if (snapshot.hasChild(task_id)) {
    //         return true;
    //     } else {
    //         return false;
    //     }
    // });

    let ref_tot = fbase.ref(`arc-stamp/${task_id}`);
    return new Promise(function(resolve,refuse) {
        ref_tot.on("value", function(snapshot) {
            let stats = snapshot.val();
            console.log("task id : " + task_id);
            console.log("child : " + stats);
            if (stats == null) {
                console.log("resolving false");
                resolve(false);
            } else {
                console.log("resolving true");
                resolve(true);
            }
        });
    });
}

function browse_tasks() {
    var subset = "training";
    $.getJSON("https://api.github.com/repos/fchollet/ARC/contents/data/" + subset, function(tasks) {
        var task_list = [];

        var promises = [];

        num_stamps_checked = 0;
        for (i=0;i<tasks.length;i++) {
            task = tasks[i];
            task.number = i;

            delete task['path'];
            delete task['sha'];
            delete task['size'];
            delete task['url'];
            delete task['html_url'];
            delete task['git_url'];
            delete task['download_url'];
            delete task['type'];
            delete task['_links'];

            task.name = task.name.split(".")[0];

            promises.push(is_stamped(task.name));

            task_list.push(task);
        }

        Promise.all(promises)
          .then((results) => {
            console.log("All done", results);
            for (i=0;i<task_list.length;i++) {
                task = task_list[i];
                task.stamped = results[i];
                console.log(task.stamped);
            }

            $('#table').bootstrapTable({
                data: task_list,
                columns: [ {},{},{},  
                {
                  field: 'operate',
                  title: 'Select',
                  align: 'center',
                  valign: 'middle',
                  clickToSelect: false,
                  formatter : function(value,row,index) {
                    return '<button class=\'btn\' pageName="'+row.number+'" data-dismiss="modal">Select</button> ';
                  }
                }
              ]               
            });

            $(".btn").click(function(){
                var pageName = $(this).attr('pageName');
                console.log(pageName);
                loadTask(pageName);

            });

          })
          .catch((error) => {
              console.log("Error : " + error + " trying to fetch stamped status");
          });
    })
    .error(function(){
      errorMsg('Error loading task list');
    });
}