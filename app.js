let jsonglob;
let globalIndex;

$(document).ready(function () {
  $(".context-menu").hide();
  $(".col").height($(window).height() - $('header').height());

  function readSingleFile(e) {
    var file = e.target.files[0];
    if (!file) {
      return;
    }
    var reader = new FileReader();
    reader.onload = function (e) {
      var contents = e.target.result;
      // Display file content
      displayContents(contents);
    };
    reader.readAsText(file);
  }

  function displayContents(contents) {
    jsonglob = JSON.parse(contents);
    $("#span_result").empty();
    jsonglob.log.entries.forEach((el, i) => {
      $("#span_result").append('<p class="status' + el.response.status + '"><a onclick="showdetail(' + i + '); $(\'p > a\').removeClass(\'selected\'); $(this).addClass(\'selected\');"><span class="badge badge-secondary">' + el.request.method + '</span> ' + el.request.url + '</a></p>');
    });
  }

  document.getElementById('file-input').addEventListener('change', readSingleFile, false);

  // disable right click and show custom context menu
  $("#span_detail").bind('contextmenu', function (e) {
    var top = e.pageY + 5;
    var left = e.pageX;

    console.log(globalIndex);
    console.log(getSelectionText());

    $('.context-menu > ul').empty();

    findInPreviousResponses(getSelectionText()).forEach(data => {
      console.log(data);
      let url = data.entry.request.url;
      let method = data.entry.request.method;
      $('.context-menu > ul').append('<li><a onclick="showdetail(' + data.index + ', \'tab3\', \'' + getSelectionText() + '\');">' + data.index + ' ' + method + ' ' + url.substring(url.lastIndexOf('/') + 1) + '</a></li>');
    });

    // Show contextmenu
    $(".context-menu").toggle(100).css({
      top: top + "px",
      left: left + "px"
    });

    // disable default context menu
    return false;
  });

  // Hide context menu
  $(document).bind('contextmenu click', function () {
    $(".context-menu").hide();
  });

  // disable context-menu from custom menu
  $('.context-menu').bind('contextmenu', function () {
    return false;
  });

  // // Clicked context-menu item
  // $('.context-menu li').click(function () {
  //   var className = $(this).find("span:nth-child(1)").attr("class");
  //   var titleid = $('#txt_id').val();
  //   $("#" + titleid).css("background-color", className);
  //   $(".context-menu").hide();
  // });

});

$(document).on("click", "#tabs li a", function () {
  var t = $(this).attr('id');
  if ($(this).hasClass('inactive')) { //this is the start of our condition
    $('#tabs li a').addClass('inactive');
    $(this).removeClass('inactive');

    $('.container').hide();
    $('#' + t + 'C').fadeIn('slow');
  }
});

function showdetail(index, tab = null, highlight = null) {
  globalIndex = index;

  let entry = jsonglob.log.entries[index];
  console.log(entry);
  $("#span_detail").html(`<ul id="tabs">
      <li><a id="tab1">Request</a></li>
      <li><a id="tab2">Response</a></li>
      <li><a id="tab3">Response Content</a></li>
      <li><a id="tab4">Cookies</a></li>
      <li><a id="tab5">Timing</a></li>
  </ul>
  <div class="container" id="tab1C">
    <h3>Start date time</h3>
    ` + entry.startedDateTime + `
  
    <h3>Url</h3>
    ` + entry.request.url + ` 
    
    <h3>Method</h3>
    ` + entry.request.method + ` 
    
    <h3>Headers</h3>
    <pre>
    ` + getNameValue(entry.request.headers) + `
    </pre>
    
    <h3>Querystring</h3>
    <pre>
    ` + getNameValue(entry.request.queryString) + `
    </pre>  
    
    <h3>Post data</h3>
    <pre>` + getPostDataOr(entry) + `</pre></div>
  <div class="container" id="tab2C">
    <h3>Status</h3>
    ` + entry.response.status + `
    
    <h3>Headers</h3>
    <pre>
    ` + getNameValue(entry.response.headers) + `
    </pre>    

</div>
  <div class="container" id="tab3C"><pre>` + getResponseContent(entry) + `</pre></div>
  <div class="container" id="tab4C">4Some content</div>
  <div class="container" id="tab5C">5Some content</div>`
  );

  if (tab) {
    $('#tabs li a').addClass('inactive');
    $('#tabs li a#' + tab).removeClass('inactive');
    $('.container').hide();
    $('#' + tab + 'C').fadeIn('slow');
  } else {
    $('#tabs li a:not(:first)').addClass('inactive');
    $('.container').hide();
    $('.container:first').show();
  }

  if (highlight) {
    let t = $('#' + tab + 'C').html();
    t = t.replace(highlight, "<span class='highlight'>" + highlight + "</span>");
    $('#' + tab + 'C').html(t);
  }
}

function getPostDataOr(entry) {
  if (entry.request.method === 'GET' || entry.request.method === 'OPTIONS') {
    return '';
  } else {
    return JSON.stringify(JSON.parse(entry.request.postData.text), null, 2);
  }
}

function getNameValue(datas) {
  let builder = '';
  // if (datas) {
  datas.forEach(data => {
    builder = builder.concat('<strong>' + data.name + ':</strong> ' + data.value + '\n');
  });
  // }
  return builder
}

function getResponseContent(entry) {
  switch (entry.response.content.mimeType) {
    case 'image/svg+xml':
      return 'Image';
      break;
    case 'application/json':
      if (entry.response.content.text) {
        return JSON.stringify(JSON.parse(entry.response.content.text), null, 2);
      } else {
        return '';
      }
      break;
    case 'text/html':
      return entry.response.content.text;
  }
}

function getSelectionText() {
  var text = "";
  if (window.getSelection) {
    text = window.getSelection().toString();
  } else if (document.selection && document.selection.type !== "Control") {
    text = document.selection.createRange().text;
  }
  return text;
}

function findInPreviousResponses(needle) {

  let result = [];
  for (let i = 0; i < globalIndex; i++) {
    let entry = jsonglob.log.entries[i];
    if (entry.response.content.text && entry.response.content.text.includes(needle)) {
      let valueToPush = {};
      valueToPush.index = i;
      valueToPush.entry = entry;
      result.push(valueToPush);
    }
  }
  console.log(result);
  return result;
}
