// Shorthands
var log = console.log;
var str = JSON.stringify;
var obj = JSON.parse;

function _____PROTOTYPE_____(){}

// Prototypes
Element.prototype.on = function(Name,func){
    this.addEventListener(Name,func);
};
Element.prototype.attr = function(Name,Val){
    if (Val==null) return this.getAttribute(Name);
    this.setAttribute(Name,Val);
};

function _____GLOBALS_____(){}

// Globals
var Global_Css = 
`* { box-sizing:border-box; }`;

var Html_File  = null;
var Css_File   = null;
var Html       = "";
var Css        = "";
var Css_Comment= "";
var rendered   = false;

const MARKER1 = "[Generated by Novaeh Comvise]";
const MARKER2 = "[Only first comment is kept]";

function _____UTILS_____(){}

// Async lock
function new_lock(){
    var unlock,Lock=new Promise((res,rej)=>{ unlock=res; });
    return [Lock,unlock];
}

// Create element
function new_ele(Tag) {
    return document.createElement(Tag);
}

// Get attribute
function attr(Ele,Name){
    return Ele.getAttribute(Name);
}

// Select
function d$(Sel){
    return document.querySelector(Sel);
}

// Select
function e$(Ele,Sel){
    return Ele.querySelector(Sel);
}

function _____MISCS_____(){}

// Show html saving warning
function show_html_saving_warn(){
    alert("After rendering with 'Visual' button, browser puts texts in structured tag "+
        "outside of the tag. Eg., some frameworks put 'for' loop outside of TR to loop TR tag, "+
        "but browser moves that 'for' loop outside of TABLE tag.");
}

function _____EDITORS_____(){}

// Set HTML
function set_editing_html(V){
    // Some how CodeMirror doesn't display gutter correctly with 
    // lines fewer than 10, add 10
    Html_Editor.setValue(V + "\n".repeat(10));
}

// Set CSS
function set_editing_css(V){
    // Some how CodeMirror doesn't display gutter correctly with 
    // lines fewer than 10, add 10
    Css_Editor.setValue(V + "\n".repeat(10));
}

// Get HTML
function get_editing_html(){
    // Need to trim the extra 10 lines added
    return Html_Editor.getValue().trim();
}

// Get CSS
function get_editing_css(){
    // Need to trim the extra 10 lines added
    return Css_Editor.getValue().trim();
}

// Set CSS with comment
function set_editing_css_with_cmt(Css){
    if (Css_Comment.trim().length>0)
        var Cmt = `${Css_Comment.trim()}\n`;
    else
        var Cmt = "";

    set_editing_css( 
        `/*\n${MARKER1}\n${MARKER2}\n`+
        `${Cmt}*/\n`+
        `${Css}`
    );
}

// Get html from dom
// WARN: CAN BE CALLED ONLY AFTER IFRAME RENDERED
function get_component_dom_html(){
    var Frame = d$("#Visual-Frame");
    var Html  = Frame.contentWindow.document.body.innerHTML;
    return Html.trim()+"\n<!-- EOF -->";
}

function _____IFRAME_____(){}

// Write to iframe
// Ref: https://stackoverflow.com/a/998241/5581893
function write_iframe(Html){
    var ifrm = document.getElementById('Visual-Frame');
    ifrm = ifrm.contentWindow || ifrm.contentDocument.document || ifrm.contentDocument;
    ifrm.document.open();
    ifrm.document.write(Html);
    ifrm.document.close();
}

// Message from iframe
var Msg_Handlers = {};
function on_message(Ev){
    try{
        var Obj = obj(Ev.data);    
        Msg_Handlers[Obj.Msg_Id](Obj.Result);
    }
    catch{
        log("Unknown message:",Ev.data);
    }
}
window.addEventListener("message",on_message);

// Send command
async function send_cmd_to_iframe(Cmd,Data={}){
    var Frame = d$("#Visual-Frame");

    if (Frame==null){
        alert("Click 'Visual' button first to render");
        return;
    }

    var Msg_Id = Math.random().toString().replace(".","");
    Frame.contentWindow.postMessage(str({Msg_Id,Cmd,Data}));

    var [Lock,unlock] = new_lock();
    Msg_Handlers[Msg_Id] = function(Result){
        unlock(Result);
    };
    return await Lock;
}

function _____DOM_____(){}

// Turn DOM to list
function recurse_for_items(List,Ele,depth){
    var Item = {
        Tag:Ele.tagName, Id:attr(Ele,"id"), Classes:attr(Ele,"class"),
        depth
    };
    if (Item.Id==null)      Item.Id="null";
    if (Item.Classes==null) Item.Classes="null";
    List.push(Item);

    for (let Child of Ele.children)
        recurse_for_items(List,Child,depth+1);
}

// Get UI row (from inside)
function row_ele(Ev){
    if (Ev.target.attr("item-row")=="yes") return Ev.target;
    var Ele = Ev.target;

    while (Ele!=null){
        if (Ele.attr("item-row")=="yes") return Ele;
        Ele = Ele.parentElement;
    }
    return null;
}

// Get DOM item to UI
function add_struct_item(Box,Item){
    var Pad = "";

    for (let _ of Array(Item.depth)) 
        Pad+=`<span style="display:inline-flex; width:1.5rem;
        justify-content:center; align-items:center;">·</span>`;

    Item.Classes = Item.Classes.replace(/[\s]{2,}/g, "\x20\x20").replaceAll("\x20",".");
    var Html = 
    `${Pad}🔷<a href="javascript:" title="Drag to reorder" style="user-select:none;"
    >${Item.Tag} #${Item.Id} .${Item.Classes}</a>
    <span class="add-child-ele" style="cursor:pointer;">➕</span>`;

    var Ele = new_ele("div");    
    Ele.attr("item-row","yes");
    Ele.innerHTML = Html;
    Box.appendChild(Ele);

    // For blink
    var Atag = e$(Ele,"a");
    Atag.setAttribute("ui-id",`#${Item.Id}`);
    Atag.setAttribute("ui-classes",`.${Item.Classes}`);

    // Events
    // Blink
    Ele.on("click",Ev=>{
        var Id2blink = Ev.target.getAttribute("ui-id");
        var Classes2blink = Ev.target.getAttribute("ui-classes");
        log("Blink",Id2blink,Classes2blink);

        if (Id2blink!="#null")
            send_cmd_to_iframe("blink-id",{Id2blink});
        if (Classes2blink!=".null");
            send_cmd_to_iframe("blink-classes",{Classes2blink});
    });

    // Add child event
    e$(Ele,".add-child-ele").on("click",Ev=>{
        alert("Please edit the HTML instead, for now");
    });

    // Drag
    Ele.on("dragstart",Ev=>{
        Ev.dataTransfer.setData("text/plain",str({ 
            Id:"#"+Item.Id, Classes:"."+Item.Classes 
        }));
    });

    // Dragover (allow dropping here)
    Ele.on("dragover",Ev=>{ Ev.preventDefault(); });
    Ele.on("dragenter",Ev=>{ Ev.target.style.backgroundColor="ivory"; });
    Ele.on("dragleave",Ev=>{ Ev.target.style.backgroundColor="transparent"; });

    // Dropzone
    Ele.on("drop",Ev=>{
        // TO-DO
        alert("Drag-and-drop feature is a work-in-progress");

        // Identify objects
        Ev.target.style.backgroundColor = "transparent";
        var Id2blink = Ev.target.getAttribute("ui-id");
        var Classes2blink = Ev.target.getAttribute("ui-classes");

        if (Id2blink=="#null" && Classes2blink==".null"){
            alert("Please set id or CSS class for that drop zone");
            return;
        }

        // Get data
        var Obj = obj(Ev.dataTransfer.getData("text"));
        
        if (Obj.Id=="#null" && Obj.Classes==".null"){
            alert("Please set id or CSS class for the dragged one");
            return;
        }

        // TO-DO: Move inside iframe, and get the HTML, 
        // need to recurse Element.childNodes instead of .children
        // for text nodes, comment nodes too. 
    });
}

function _____UI_AREAS_____(){}

// Check if iframe ready
function iframe_ready() {
    var Frame = d$("#Visual-Frame");
    return Frame.contentWindow.document.body!=null;
}

// Show DOM of component being edited
function show_dom_struct() {
    var Frame     = d$("#Visual-Frame");
    var Html      = Frame.contentWindow.document.body.innerHTML;
    var Ele       = new_ele("div");
    Ele.innerHTML = Html;

    var Items = [];
    recurse_for_items(Items,Ele,0);
    var Box = d$("#Struct-Box");
    Box.innerHTML = "<div>Click to blink in UI</div>";
    
    for (let Item of Items)
        add_struct_item(Box,Item);
}

// Show visual
function show_visual(){
    if (Html_File==null || Css_File==null){
        alert("Must load both HTML and CSS files");
        return;
    }
    d$("#Caption").innerHTML = "Rendered as:";
    d$("#Visual-Box").style.display = "block";
    d$("#Html-Box").style.display = "none";
    d$("#Css-Box").style.display = "none";

    // Show contents
    var C = get_editing_css();
    var H = get_editing_html();
    var Html = 
    `<iframe id="Visual-Frame" frameBorder="0"
        style="width:calc(66vw - 3rem); height:calc(100vh - 11rem);
        outline:none; overflow:auto; overflow-x:hidden;">
    </iframe>`;
    d$("#Visual-Box").innerHTML = Html;

    // Blink: https://stackoverflow.com/a/72819596/5581893
    var Comhtml = 
    `<script src="iframe.js"></script>
    <style title="global-css">
        .blink {
            animation: blinkIt 0.5s infinite; background-color:yellow;
        }
        @keyframes blinkIt {
            from { opacity: 0; }  
            to { opacity: 1; }
        }
    </style>
    <style title="global-css">${Global_Css}</style>
    <style>${C}</style>
    <body style="margin:0 !important; padding:0 !important;">${H}</body>`;
    write_iframe(Comhtml);

    setTimeout(function check(){
        if (!iframe_ready()){
            setTimeout(check,100);
            return;
        }
        log("Iframe is written and ready");
        show_dom_struct();
        rendered = true;
    },100);
}

// Show html
function show_html(){
    d$("#Caption").innerHTML = "Edit HTML:";
    d$("#Visual-Box").style.display = "none";
    d$("#Html-Box").style.display = "block";
    d$("#Css-Box").style.display = "none";
}

// Show css
function show_css(){
    d$("#Caption").innerHTML = "Edit CSS:";
    d$("#Visual-Box").style.display = "none";
    d$("#Html-Box").style.display = "none";
    d$("#Css-Box").style.display = "block";
}

// Show status text
function show_status(Str){
    d$("#Status").innerHTML = Str;
}

function _____FILES_____(){}

// Read file
// NOTE: CODE FROM COPILOT
async function read_file() {    
    // Open the file picker
    const [fileHandle] = await window.showOpenFilePicker();
    // Get the file
    const file = await fileHandle.getFile();
    // Read the file content as text
    const content = await file.text();
    return [fileHandle,content];    
}

// Write file
// NOTE: CODE FROM COPILOT
async function write_to_file(Handle,Text) {
    const writable = await Handle.createWritable();
    // Write data to the file
    await writable.write(Text);
    // Close the stream
    await writable.close();
}

function _____LOAD_N_SAVE_____(){}

// Get comment from CSS file
function extract_comment(C){
    if (C.indexOf("*/")>=0 && C.trim().substring(0,2)=="/*"){
        let pos = C.indexOf("*/");
        let Cmt = C.substring(0,pos).replaceAll("/*","").trim();
        Css_Comment = Cmt;        
        Css_Comment = Css_Comment.replaceAll(MARKER1,"");
        Css_Comment = Css_Comment.replaceAll(MARKER2,"");
        log("Comment found in CSS:",Css_Comment);
    }
    else
        Css_Comment="";
}

// Load html
async function load_html(Ev){
    var [F,H] = await read_file();

    if (F.name.match(/\.html$/)==null){
        alert("Must be .html file");
        return;
    }
    Html_File = F;
    Html      = H.replace(/\t/g, "\x20\x20\x20\x20").replace(/\r\n/g, "\n");
    log("HTML loaded:",F);
    set_editing_html(H);
    show_status("Loaded HTML, length: "+H.length);
    show_html();
}

// Load css
async function load_css(Ev){
    var [F,C] = await read_file();

    if (F.name.match(/\.css/)==null){
        alert("Must be .css file");
        return;
    }
    // Save the first comment
    extract_comment(C);

    // Show css
    Css_File  = F;
    Css       = C.trim().replace(/\t/g, "\x20\x20\x20\x20").replace(/\r\n/g, "\n");
    log("CSS loaded:",F);
    set_editing_css(C);
    show_status("Loaded CSS, length: "+C.length);
    show_css();
}

// Load global css
async function load_global_css(Ev){
    var [F,C] = await read_file();

    if (F.name.match(/\.css/)==null){
        alert("Must be .css file");
        return;
    }
    Global_Css= C.replace(/\t/g, "\x20\x20\x20\x20").replace(/\r\n/g, "\n");
    log("Global CSS loaded:",F);
    show_status("Loaded global CSS, length: "+C.length);
}

// Save html
async function save_html(){
    if (Html_File==null){
        alert("HTML file not loaded yet");
        return;
    }
    if (!rendered){
        alert("Must click 'Visual' at least once, coz CSS is taken from live UI");
        return;
    }
    show_html();

    // Save
    var from_dom = d$("#Save-From-Dom").checked;
    Html_File.requestPermission({mode:"readwrite"});

    if (from_dom===true)
        await write_to_file(Html_File, get_component_dom_html());
    else
        await write_to_file(Html_File, get_editing_html());

    show_status("HTML written to file");
}

// Save css
async function save_css(){
    if (Css_File==null){
        alert("CSS file not loaded yet");
        return;
    }
    if (!rendered){
        alert("Must click 'Visual' at least once, coz CSS is taken from live UI");
        return;
    }
    var Livecss = await send_cmd_to_iframe("get-css");
    extract_comment( get_editing_css() );
    set_editing_css_with_cmt(Livecss);
    show_css();

    // Save
    Css_File.requestPermission({mode:"readwrite"});
    await write_to_file(Css_File, get_editing_css());
    show_status("CSS written to file");
}

function _____MAIN_____(){}

// Main
var Html_Editor = null;
var Css_Editor  = null;

async function main(){
    Html_Editor = CodeMirror.fromTextArea(d$("#Html-Edit"),{
        lineNumbers:true, mode:"htmlmixed", indentUnit:4, tabSize:4,
        indentWithTabs:false, lineWrapping:true, gutter:true
    });
    Css_Editor = CodeMirror.fromTextArea(d$("#Css-Edit"),{
        lineNumbers:true, mode:"css", indentUnit:4, tabSize:4,
        indentWithTabs:false, lineWrapping:true, gutter:true
    });
    window.Hed = Html_Editor;
    window.Ced = Css_Editor;
    set_editing_html("HTML here");
    set_editing_css("CSS here");
};
window.onload = main;
// EOF
