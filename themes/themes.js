const themes = {
    "デフォルト": "theme-default",
    "ベリー": "theme-berry",
    "白黒": "theme-black-white",
    "夕暮れ": "theme-dusk",
    "霜": "theme-frost",
    "ハロウィン": "theme-halloween",
    "オーロラ": "theme-northern-lights",
    "プライド": "theme-pride",
    "スプルース": "theme-spruce",
    "鋼": "theme-steel",
    "日暮れ": "theme-sunset",
    "黄昏": "theme-twilight",
    "ZN-エリート" : "theme-zn"
}

function loadThemes(){
    let theme_options = ""
    Object.keys(themes).forEach((key) => {
        theme_options += `<option value="${key}">${key}</option>`
    })
    $("#theme").html(theme_options)
}

function changeTheme(name = null){

    let changeObjects = [
        ".ghost_card",".menu","#settings_box","#settings_tab",
        "#event_box","#event_tab","#wiki_box","#wiki_tab",
        "#maps_box","#maps_tab","#language_box","#language_tab",
        "#theme_box","#theme_tab","#info_box","#info_box_voice"
    ]

    let theme_name = name != null ? name : $("#theme").val()

    changeObjects.forEach((item) => {
        $(item).removeClass(Object.values(themes))
        $(item).addClass(themes[theme_name])
    })
}