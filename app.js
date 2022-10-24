let jsonglob;
let globalIndex;
let global_entries;
let filtered_entries;

$(document).ready(function () {
    let fileName = localStorage.getItem('FILE_NAME');
    let fileContent = localStorage.getItem('FILE_CONTENT');
    let includeFilter = localStorage.getItem('INCLUDE_FILTER');
    let excludeFilter = localStorage.getItem('EXCLUDE_FILTER');
    $('.context-menu').hide();
    $('.col').height($(window).height() - $('header').height());

    function readSingleFile(e) {
        const file = e.target.files[0];
        localStorage.setItem('FILE_NAME', file.name);
        if (!file) {
            return;
        }
        const reader = new FileReader();
        reader.onload = function (e) {
            const contents = e.target.result;
            // Display file content
            global_entries = JSON.parse(contents).log.entries;
            filtered_entries = global_entries;
            try {
                localStorage.setItem('FILE_CONTENT', JSON.stringify(global_entries));
            } catch (e) {
                console.log('dom exception')
            }
            displayContents(global_entries);
        };
        reader.readAsText(file);
    }

    function displayContents(data) {
        $('#span_result').empty();
        data.forEach((el, i) => {
            $('#span_result').append('<p class="status' + el.response.status + '"><a onclick="showdetail(' + i + '); $(\'p > a\').removeClass(\'selected\'); $(this).addClass(\'selected\');">' + i + ' <span class="badge badge-secondary">' + el.request.method + '</span> ' + el.request.url + '</a></p>');
        });
    }

    document.getElementById('file-input').addEventListener('change', readSingleFile, false);

    if (fileName) {
        global_entries = JSON.parse(fileContent);
        filtered_entries = global_entries;
        displayContents(global_entries);
    }

    if (includeFilter) {
        $('#include-filter').val(includeFilter);
        filterBasedOnIncludePattern(includeFilter);
    }

    if (excludeFilter) {
        $('#exclude-filter').val(excludeFilter);
        filterBasedOnExcludePattern(excludeFilter);
    }

    $('#include-filter').change(function () {
        let filters = $(this).val();
        localStorage.setItem('INCLUDE_FILTER', filters);
        filterBasedOnIncludePattern(filters);
    });

    $('#exclude-filter').change(function () {
        let filters = $(this).val();
        localStorage.setItem('EXCLUDE_FILTER', filters);
        filterBasedOnExcludePattern(filters)
    });

    function filterBasedOnIncludePattern(filters) {
        filtered_entries = global_entries.filter(function (item) {
            let result = true;
            filters.split(',').forEach(filter => {
                if (result !== false) {
                    result = item.request.url.endsWith(filter);
                }
            });
            return result;
        });
        displayContents(filtered_entries);
    }

    function filterBasedOnExcludePattern(filters) {
        filtered_entries = global_entries.filter(function (item) {
            let result = true;
            filters.split(',').forEach(filter => {
                if (result !== false) {
                    result = !item.request.url.endsWith(filter);
                }
            });
            return result;
        });
        displayContents(filtered_entries);
    }

    $('#span_detail').bind('contextmenu', function (e) {
        const top = e.pageY + 5;
        const left = e.pageX;

        $('.context-menu > ul').empty();

        findInPreviousResponses(getSelectionText()).forEach(data => {
            let url = data.entry.request.url;
            let method = data.entry.request.method;
            $('.context-menu > ul').append('<li><a onclick="showdetail(' + data.index + ', \'tab3\', \'' + getSelectionText() + '\');">' + data.index + ' ' + method + ' ' + url.substring(url.lastIndexOf('/') + 1) + '</a></li>');
        });

        $('.context-menu').toggle(100).css({
            top: top + 'px', left: left + 'px'
        });
        return false;
    });

    $(document).bind('contextmenu click', function () {
        $('.context-menu').hide();
    });

    $('.context-menu').bind('contextmenu', function () {
        return false;
    });

});

$(document).on('click', '#tabs li a', function () {
    const t = $(this).attr('id');
    if ($(this).hasClass('inactive')) { //this is the start of our condition
        $('#tabs li a').addClass('inactive');
        $(this).removeClass('inactive');

        $('.container').hide();
        $('#' + t + 'C').fadeIn('slow');
    }
});

function showdetail(index, tab = null, highlight = null) {
    globalIndex = index;
    let entry = filtered_entries[index];
    $('#span_detail').html(`<ul id="tabs">
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
  <div class="container" id="tab5C">5Some content</div>`);

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
    datas.forEach(data => {
        builder = builder.concat('<strong>' + data.name + ':</strong> ' + data.value + '\n');
    });
    return builder
}

function getResponseContent(entry) {
    // console.log(entry.response.content)
    switch (entry.response.content.mimeType) {
        case 'image/svg+xml':
            return 'Image';
            break;
        case 'application/json; charset=utf-8':
        case 'application/json':
            if (entry.response.content.text) {
                return JSON.stringify(JSON.parse(entry.response.content.text), null, 2);
            } else {
                return '';
            }
            break;
        case 'application/xml':
        case 'text/html':
            return entry.response.content.text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }
}

function getSelectionText() {
    let text = "";
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
        let entry = filtered_entries[i];
        if (entry.response.content.text && entry.response.content.text.includes(needle)) {
            let valueToPush = {};
            valueToPush.index = i;
            valueToPush.entry = entry;
            result.push(valueToPush);
        }
    }
    return result;
}
