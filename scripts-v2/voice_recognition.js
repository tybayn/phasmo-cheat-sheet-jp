const levenshtein_distance = (str1 = '', str2 = '') => {
    const track = Array(str2.length + 1).fill(null).map(() =>
    Array(str1.length + 1).fill(null));
    for (let i = 0; i <= str1.length; i += 1) {
       track[0][i] = i;
    }
    for (let j = 0; j <= str2.length; j += 1) {
       track[j][0] = j;
    }
    for (let j = 1; j <= str2.length; j += 1) {
       for (let i = 1; i <= str1.length; i += 1) {
          const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
          track[j][i] = Math.min(
             track[j][i - 1] + 1,
             track[j - 1][i] + 1,
             track[j - 1][i - 1] + indicator,
          );
       }
    }
    return track[str2.length][str1.length];
 };

 let running_log = []

 $.fn.isInViewport = function () {
    let elementTop = $(this).offset().top;
    let elementBottom = elementTop + $(this).outerHeight();
  
    let viewportTop = $(window).scrollTop();
    let viewportBottom = viewportTop + window.innerHeight;
  
    return elementBottom > viewportTop && elementTop < viewportBottom;
}

function reset_voice_status(){
    setTimeout(function(){
        document.getElementById("voice_recognition_status").style.backgroundImage = "url(imgs/mic.png)";
        document.getElementById("voice_recognition_status").className = "pulse_animation"
    },1000)
}

function domovoi_show_last(){
    $("#domovoi-text").show()
    $("#domovoi-img").attr("src","imgs/domovoi-heard.png")
}

function domovoi_hide_last(){
    $("#domovoi-text").hide()
    $("#domovoi-img").attr("src","imgs/domovoi.png")
}


function domovoi_heard(message){
    $("#domovoi-text").text(message.toLowerCase())
    $("#domovoi-text").show()
    $("#domovoi-img").attr("src","imgs/domovoi-heard.png")
    setTimeout(function() {
        $("#domovoi-text").hide()
        $("#domovoi-img").attr("src",markedDead ? "imgs/domovoi-died.png" : "imgs/domovoi.png")
    },2000)
}

function domovoi_not_heard(){
    $("#domovoi-img").attr("src",user_settings['domo_side'] == 1 ? "imgs/domovoi-guess-flip.png" : "imgs/domovoi-guess.png")
    setTimeout(function() {
        $("#domovoi-img").attr("src",markedDead ? "imgs/domovoi-died.png" : "imgs/domovoi.png")
    },3000)
}

function domovoi_print_logs(){
    console.log("----------------------------------------------------------------")
    console.log("Domo memory:")
    running_log.forEach(function (item,idx){
        console.log(`--${idx}--`)
        for (const [key, value] of Object.entries(item)) {
            console.log(`${key}: ${value}`)
        }
    })
    console.log("----------------------------------------------------------------")
}

function parse_speech(vtext){
    vtext = vtext.toLowerCase().trim()
    running_log.push({
        "Time":new Date().toJSON().replace('T', ' ').split('.')[0],
        "Raw":vtext
    })
    if(running_log.length > 5){
        running_log.shift()
    }
    let cur_idx = running_log.length - 1

    domovoi_msg = ""

    for (const [key, value] of Object.entries(ZNLANG['overall'])) {
        for (var i = 0; i < value.length; i++) {
            vtext = vtext.replace(value[i], key);
        }
    }

    running_log[cur_idx]["Cleaned"] = vtext

    if(vtext.startsWith('ゴースト 速度')){
        document.getElementById("voice_recognition_status").className = null
        document.getElementById("voice_recognition_status").style.backgroundImage = "url(imgs/mic-recognized.png)"
        console.log("Recognized ghost speed command")
        running_log[cur_idx]["Type"] = "ゴースト 速度"
        console.log(`Heard '${vtext}'`)
        vtext = vtext.replace('ゴースト 速度', "").trim()
        domovoi_msg += "ゴーストスピードを"

        vtext = vtext.replace('三','3')
        vtext = vtext.replace('二','2')
        vtext = vtext.replace('一','1')
        vtext = vtext.replace('零','0')

        var smallest_num = '150'
        var smallest_val = 100
        var prev_value = document.getElementById("ghost_modifier_speed").value
        var all_ghost_speed = ['50','75','100','125','150']
        var all_ghost_speed_convert = {'50':0,'75':1,'100':2,'125':3,'150':4}

        for(var i = 0; i < all_ghost_speed.length; i++){
            var leven_val = levenshtein_distance(all_ghost_speed[i],vtext)
            if(leven_val < smallest_val){
                smallest_val = leven_val 
                smallest_num = all_ghost_speed[i]
            }
        }
        domovoi_msg += smallest_num + "とマーク"

        document.getElementById("ghost_modifier_speed").value = all_ghost_speed_convert[smallest_num] ?? 2

        if(prev_value != all_ghost_speed_convert[smallest_num]){
            setTempo();
            bpm_calc(true);
            saveSettings();
            send_state()
        }

        domovoi_heard(domovoi_msg)
        running_log[cur_idx]["Domo"] = domovoi_msg
        reset_voice_status()
    }
    else if(vtext.startsWith('ゴースト')){
        document.getElementById("voice_recognition_status").className = null
        document.getElementById("voice_recognition_status").style.backgroundImage = "url(imgs/mic-recognized.png)"
        console.log("Recognized ghost command")
        running_log[cur_idx]["Type"] = "ゴースト"
        console.log(`Heard '${vtext}'`)
        vtext = vtext.replace('ゴースト', "").trim()
        domovoi_msg += "ゴースト"

        var smallest_ghost = "スピリット"
        var smallest_val = 100
        var vvalue = 0
        if(vtext.startsWith("ではない")){
            vtext = vtext.replace('ではない', "").trim()
            vvalue = 0
            domovoi_msg += "ではない"
        }
        else if(vtext.startsWith("クリア")){
            vtext = vtext.replace('クリア', "").trim()
            vvalue = 0
            domovoi_msg = "クリア"
        }
        else if(vtext.startsWith("選択")){
            vtext = vtext.replace('選択', "").trim()
            vvalue = 2
            domovoi_msg = "選択"
        }
        else if(vtext.startsWith("削除")){
            vtext = vtext.replace('削除', "").trim()
            vvalue = -1
            domovoi_msg = "削除"
        }
        else if(vtext.startsWith("見せる") || vtext.startsWith("概要") || vtext.startsWith("見せる概要")){
            vtext = vtext.replace('見せる', "").replace('概要', "").replace('見せる概要', "").trim()
            vvalue = -10
            domovoi_msg = "の情報を表示"
        }

        // Common fixes to ghosts
        var prevtext = vtext;
        for (const [key, value] of Object.entries(ZNLANG['ghosts'])) {
            for (var i = 0; i < value.length; i++) {
                if(vtext.startsWith(value[i])){vtext = key}
            }
        }

        for(var i = 0; i < Object.keys(all_ghosts).length; i++){
            var leven_val = levenshtein_distance(Object.values(all_ghosts)[i].toLowerCase(),vtext)
            if(leven_val < smallest_val){
                smallest_val = leven_val 
                smallest_ghost = Object.values(all_ghosts)[i]
            }
        }
        console.log(`${prevtext} >> ${vtext} >> ${smallest_ghost}`)
        running_log[cur_idx]["Debug"] = `${prevtext} >> ${vtext} >> ${smallest_ghost}`
        domovoi_msg += smallest_ghost

        if (vvalue == 0){
            fade(document.getElementById(rev(all_ghosts,smallest_ghost)));
        }
        else if (vvalue == 3){
            guess(document.getElementById(rev(all_ghosts,smallest_ghost)));
            if(!$(document.getElementById(rev(all_ghosts,smallest_ghost))).isInViewport())
                document.getElementById(rev(all_ghosts,smallest_ghost)).scrollIntoView({alignToTop:true,behavior:"smooth"})
        }
        else if (vvalue == 2){
            select(document.getElementById(rev(all_ghosts,smallest_ghost)));
            if(!$(document.getElementById(rev(all_ghosts,smallest_ghost))).isInViewport())
                document.getElementById(rev(all_ghosts,smallest_ghost)).scrollIntoView({alignToTop:true,behavior:"smooth"})
        }
        else if (vvalue == -1){
            remove(document.getElementById(rev(all_ghosts,smallest_ghost)));
        }
        else if (vvalue == -2){
            died(document.getElementById(rev(all_ghosts,smallest_ghost)));
            if(!$(document.getElementById(rev(all_ghosts,smallest_ghost))).isInViewport())
                document.getElementById(rev(all_ghosts,smallest_ghost)).scrollIntoView({alignToTop:true,behavior:"smooth"})
        }
        else if(vvalue == -10){
            if(!$(document.getElementById(rev(all_ghosts,smallest_ghost))).isInViewport())
                document.getElementById(rev(all_ghosts,smallest_ghost)).scrollIntoView({alignToTop:true,behavior:"smooth"})
            send_ghost_data_link(smallest_ghost)
            domovoi_msg = smallest_ghost + domovoi_msg
        }

        resetResetButton()
        domovoi_heard(domovoi_msg)
        running_log[cur_idx]["Domo"] = domovoi_msg
        reset_voice_status()
    }
    else if(vtext.startsWith('証拠')){
        document.getElementById("voice_recognition_status").className = null
        document.getElementById("voice_recognition_status").style.backgroundImage = "url(imgs/mic-recognized.png)"
        console.log("Recognized evidence command")
        running_log[cur_idx]["Type"] = "証拠"
        console.log(`Heard '${vtext}'`)
        vtext = vtext.replace('証拠', "").trim()
        domovoi_msg += "証拠"

        var smallest_evidence = "emf 5"
        var smallest_val = 100
        var vvalue = 1
        if(vtext.startsWith("ではない")){
            vtext = vtext.replace('ではない', "").trim()
            vvalue = -1
            domovoi_msg += "ではない"
        }
        else if(vtext.startsWith("クリア")){
            vtext = vtext.replace('クリア', "").trim()
            vvalue = 0
            domovoi_msg = "クリア"
        }

        // Common replacements for evidence names
        var prevtext = vtext;
        for (const [key, value] of Object.entries(ZNLANG['evidence'])) {
            for (var i = 0; i < value.length; i++) {
                if(vtext.startsWith(value[i])){vtext = key}
            }
        }


        for(var i = 0; i < Object.keys(all_evidence).length; i++){
            var leven_val = levenshtein_distance(Object.values(all_evidence)[i].toLowerCase(),vtext)
            if(leven_val < smallest_val){
                smallest_val = leven_val 
                smallest_evidence = Object.values(all_evidence)[i]
            }
        }
        console.log(`${prevtext} >> ${vtext} >> ${smallest_evidence}`)
        running_log[cur_idx]["Debug"] = `${prevtext} >> ${vtext} >> ${smallest_evidence}`
        domovoi_msg += smallest_evidence

        if(!$(document.getElementById(rev(all_evidence,smallest_evidence)).querySelector("#checkbox")).hasClass("block")){
            while (vvalue != {"good":1,"bad":-1,"neutral":0}[document.getElementById(rev(all_evidence,smallest_evidence)).querySelector("#checkbox").classList[0]]){
                tristate(document.getElementById(rev(all_evidence,smallest_evidence)));
            }
        }
        else{
            domovoi_msg = `${smallest_evidence}がロックされる!`
        }
        

        resetResetButton()
        domovoi_heard(domovoi_msg)
        running_log[cur_idx]["Domo"] = domovoi_msg
        reset_voice_status()

    }
    else if(vtext.startsWith('猿の手')){
        document.getElementById("voice_recognition_status").className = null
        document.getElementById("voice_recognition_status").style.backgroundImage = "url(imgs/mic-recognized.png)"
        console.log("Recognized monkey paw command")
        running_log[cur_idx]["Type"] = "猿の手"
        console.log(`Heard '${vtext}'`)
        vtext = vtext.replace('猿の手', "").trim()
        domovoi_msg += "猿の手の証拠として"

        var smallest_evidence = "emf 5"
        var smallest_val = 100
        var vvalue = 1

        // Common replacements for evidence names
        var prevtext = vtext;
        for (const [key, value] of Object.entries(ZNLANG['evidence'])) {
            for (var i = 0; i < value.length; i++) {
                if(vtext.startsWith(value[i])){vtext = key}
            }
        }

        for(var i = 0; i < Object.keys(all_evidence).length; i++){
            var leven_val = levenshtein_distance(Object.values(all_evidence)[i].toLowerCase(),vtext)
            if(leven_val < smallest_val){
                smallest_val = leven_val 
                smallest_evidence = Object.values(all_evidence)[i]
            }
        }
        console.log(`${prevtext} >> ${vtext} >> ${smallest_evidence}`)
        running_log[cur_idx]["Debug"] = `${prevtext} >> ${vtext} >> ${smallest_evidence}`
        domovoi_msg += `${smallest_evidence}をマーク`

        monkeyPawFilter($(document.getElementById(rev(all_evidence,smallest_evidence))).parent().find(".monkey-paw-select"))

        resetResetButton()
        domovoi_heard(domovoi_msg)
        running_log[cur_idx]["Domo"] = domovoi_msg
        reset_voice_status()

    }
    else if(vtext.startsWith('速度')){
        document.getElementById("voice_recognition_status").className = null
        document.getElementById("voice_recognition_status").style.backgroundImage = "url(imgs/mic-recognized.png)"
        console.log("Recognized speed command")
        running_log[cur_idx]["Type"] = "速度"
        console.log(`Heard '${vtext}'`)
        vtext = vtext.replace('速度', "").trim()
        domovoi_msg += "速度"

        var smallest_speed = "通常"
        var smallest_val = 100
        var vvalue = 1
        if(vtext.startsWith("ではない")){
            vtext = vtext.replace('ではない', "").trim()
            vvalue = 0
            domovoi_msg += "ではない"
        }
        else if(vtext.startsWith("クリア")){
            vtext = vtext.replace('クリア', "").trim()
            vvalue = -1
            domovoi_msg = "クリア"
        }

        if (vtext.startsWith("視認加速")){
            console.log(`${vtext} >> Line of Sight`)
            running_log[cur_idx]["Debug"] = `${vtext} >> Line of Sight`

            vtext = vtext.replace("視認加速","")
            if (vtext.startsWith("がない"))
                vvalue = 0

            if((vvalue==0 && all_los()) || (vvalue==1 && all_not_los())){
                domovoi_msg = `${vvalue == 0 ? '現在のゴーストはすべて速度 視認加速を持っている' : '現在のゴーストは速度 視認加速を持っていません'}`
            }
            else{
                while (!$(document.getElementById("LOS").querySelector("#checkbox")).hasClass(["neutral","bad","good"][vvalue+1])){
                    tristate(document.getElementById("LOS"));
                }
                domovoi_msg = `速度 視認加速${vvalue == -1 ? 'クリア' : vvalue == 0 ? 'がない' : 'がある'}`
            }
        }
        else{

            if (vvalue == -1){
                vvalue = 0
            }

            // Common replacements for speed
            var prevtext = vtext;
            for (const [key, value] of Object.entries(ZNLANG['speed'])) {
                for (var i = 0; i < value.length; i++) {
                    if(vtext.startsWith(value[i])){vtext = key}
                }
            }

            for(var i = 0; i < Object.keys(all_speed).length; i++){
                var leven_val = levenshtein_distance(Object.values(all_speed)[i].toLowerCase(),vtext)
                if(leven_val < smallest_val){
                    smallest_val = leven_val 
                    smallest_speed = Object.values(all_speed)[i]
                }
            }
            console.log(`${prevtext} >> ${vtext} >> ${smallest_speed}`)
            running_log[cur_idx]["Debug"] = `${prevtext} >> ${vtext} >> ${smallest_speed}`
            domovoi_msg += smallest_speed

            if(!$(document.getElementById(rev(all_speed,smallest_speed)).querySelector("#checkbox")).hasClass("block")){
                while (vvalue != {"good":1,"neutral":0}[document.getElementById(rev(all_speed,smallest_speed)).querySelector("#checkbox").classList[0]]){
                    dualstate(document.getElementById(rev(all_speed,smallest_speed)));
                }
            }
            else{
                domovoi_msg = `${smallest_speed}がロックされる`
            }
        }
        
        resetResetButton()
        domovoi_heard(domovoi_msg)
        running_log[cur_idx]["Domo"] = domovoi_msg
        reset_voice_status()

    }
    else if(vtext.startsWith('正気度')){
        document.getElementById("voice_recognition_status").className = null
        document.getElementById("voice_recognition_status").style.backgroundImage = "url(imgs/mic-recognized.png)"
        console.log("Recognized sanity command")
        running_log[cur_idx]["Type"] = "正気度"
        console.log(`Heard '${vtext}'`)
        vtext = vtext.replace('正気度', "").trim()
        domovoi_msg += "正気度"

        var smallest_sanity = "遅い"
        var smallest_val = 100
        var vvalue = 1
        if(vtext.startsWith("ではない")){
            vtext = vtext.replace('ではない', "").trim()
            vvalue = 0
            domovoi_msg += "ではない"
        }
        else if(vtext.startsWith("クリア")){
            vtext = vtext.replace('クリア', "").trim()
            vvalue = 0
            domovoi_msg = "クリア"
        }

        // Common replacements for sanity
        var prevtext = vtext;
        for (const [key, value] of Object.entries(ZNLANG['sanity'])) {
            for (var i = 0; i < value.length; i++) {
                if(vtext.startsWith(value[i])){vtext = key}
            }
        }

        for(var i = 0; i < Object.keys(all_sanity).length; i++){
            var leven_val = levenshtein_distance(Object.values(all_sanity)[i].toLowerCase(),vtext)
            if(leven_val < smallest_val){
                smallest_val = leven_val 
                smallest_sanity = Object.values(all_sanity)[i]
            }
        }
        console.log(`${prevtext} >> ${vtext} >> ${smallest_sanity}`)
        running_log[cur_idx]["Debug"] = `${prevtext} >> ${vtext} >> ${smallest_sanity}`
        domovoi_msg += smallest_sanity.replace("Average","通常")

        if(!$(document.getElementById(rev(all_sanity,smallest_sanity)).querySelector("#checkbox")).hasClass("block")){
            while (vvalue != {"good":1,"neutral":0}[document.getElementById(rev(all_sanity,smallest_sanity)).querySelector("#checkbox").classList[0]]){
                dualstate(document.getElementById(rev(all_sanity,smallest_sanity)),false,true);
            }
        }
        else{
            domovoi_msg = `${smallest_sanity}がロックされる`
        }

        resetResetButton()
        domovoi_heard(domovoi_msg)
        running_log[cur_idx]["Domo"] = domovoi_msg
        reset_voice_status()

    }
    else if(vtext.startsWith('タイマー')){
        document.getElementById("voice_recognition_status").className = null
        document.getElementById("voice_recognition_status").style.backgroundImage = "url(imgs/mic-recognized.png)"
        console.log("Recognized timer command")
        running_log[cur_idx]["Type"] = "タイマー"
        console.log(`Heard '${vtext}'`)
        vtext = vtext.replace('タイマー', "").trim()
        

        if(vtext == "スタート"){
            domovoi_msg += "スマッジ(浄化香)タイマーを開始する"
            toggle_timer(true,false)
            send_timer(true,false)
        } 
        else if(vtext == "ストップ"){
            domovoi_msg += "スマッジ(浄化香)タイマーを停止する"
            toggle_timer(false,true)
            send_timer(false,true)
        }
        

        domovoi_heard(domovoi_msg)
        running_log[cur_idx]["Domo"] = domovoi_msg
        reset_voice_status()
    }
    else if(vtext.startsWith('クールダウン')){
        document.getElementById("voice_recognition_status").className = null
        document.getElementById("voice_recognition_status").style.backgroundImage = "url(imgs/mic-recognized.png)"
        console.log("Recognized cooldown command")
        running_log[cur_idx]["Type"] = "クールダウン"
        console.log(`Heard '${vtext}'`)
        vtext = vtext.replace('クールダウン', "").trim()
        
        if(vtext == "スタート"){
            domovoi_msg += "クールダウンタイマーを開始する"
            toggle_cooldown_timer(true,false)
            send_cooldown_timer(true,false)
        } 
        else if(vtext == "ストップ"){
            domovoi_msg += "クールダウンタイマーを停止する"
            toggle_cooldown_timer(false,true)
            send_cooldown_timer(false,true)
        }

        domovoi_heard(domovoi_msg)
        running_log[cur_idx]["Domo"] = domovoi_msg
        reset_voice_status()
    }
    else if(vtext.startsWith('ハント時間')){
        document.getElementById("voice_recognition_status").className = null
        document.getElementById("voice_recognition_status").style.backgroundImage = "url(imgs/mic-recognized.png)"
        console.log("Recognized hunt duration set command")
        running_log[cur_idx]["Type"] = "ハント時間"
        console.log(`Heard '${vtext}'`)
        vtext = vtext.replace('ハント時間', "").trim()
        domovoi_msg += "ハント時間を設定します： "

        if(document.getElementById("num_evidence").value == "-1"){

            var smallest_num = "3"
            var smallest_val = 100
            var prev_value = document.getElementById("cust_hunt_length").value
            var all_hunt_length = ["短い","低","中","長","高"]

            for(var i = 0; i < all_hunt_length.length; i++){
                var leven_val = levenshtein_distance(all_hunt_length[i],vtext)
                if(leven_val < smallest_val){
                    smallest_val = leven_val 
                    smallest_num = all_hunt_length[i]
                }
            }
            domovoi_msg += smallest_num

            smallest_num = {"短い":"3A","低":"3A","中":"3I","長":"3","高":"3"}[smallest_num]
            document.getElementById("cust_hunt_length").value = smallest_num
            if(prev_value != smallest_num){
                filter()
                updateMapDifficulty(smallest_num)
                saveSettings()
            }
        }
        else{
            domovoi_msg = "カスタム難易度が選択されていない"
        }

        domovoi_heard(domovoi_msg)
        running_log[cur_idx]["Domo"] = domovoi_msg
        reset_voice_status()
    }
    else if(vtext.startsWith('証拠数')){
        document.getElementById("voice_recognition_status").className = null
        document.getElementById("voice_recognition_status").style.backgroundImage = "url(imgs/mic-recognized.png)"
        console.log("Recognized number of evidence set command")
        running_log[cur_idx]["Type"] = "証拠数"
        console.log(`Heard '${vtext}'`)
        vtext = vtext.replace('証拠数', "").trim()
        domovoi_msg += "証拠数を設定する： "

        vtext = vtext.replace('三','3')
        vtext = vtext.replace('二','2')
        vtext = vtext.replace('一','1')
        vtext = vtext.replace('零','0')

        if(document.getElementById("num_evidence").value == "-1"){

            var smallest_num = '3'
            var smallest_val = 100
            var prev_value = document.getElementById("cust_num_evidence").value
            var all_difficulty = ['0','1','2','3']

            for(var i = 0; i < all_difficulty.length; i++){
                var leven_val = levenshtein_distance(all_difficulty[i],vtext)
                if(leven_val < smallest_val){
                    smallest_val = leven_val 
                    smallest_num = all_difficulty[i]
                }
            }
            domovoi_msg += smallest_num

            document.getElementById("cust_num_evidence").value = smallest_num ?? "3"
            if(prev_value != smallest_num){
                filter()
                flashMode()
                saveSettings()
            }
        }
        else{
            domovoi_msg = "カスタム難易度が選択されていない"
        }

        domovoi_heard(domovoi_msg)
        running_log[cur_idx]["Domo"] = domovoi_msg
        reset_voice_status()
    }
    else if(vtext.startsWith('ハント')){
        document.getElementById("voice_recognition_status").className = null
        document.getElementById("voice_recognition_status").style.backgroundImage = "url(imgs/mic-recognized.png)"
        console.log("Recognized hunt command")
        running_log[cur_idx]["Type"] = "ハント"
        console.log(`Heard '${vtext}'`)
        vtext = vtext.replace('ハント', "").trim()

        if(vtext == "スタート"){
            domovoi_msg += "ハントタイマーを開始する"
            toggle_hunt_timer(true,false)
            send_hunt_timer(true,false)
        } 
        else if(vtext == "ストップ"){
            domovoi_msg += "ハントタイマーを停止する"
            toggle_hunt_timer(false,true)
            send_hunt_timer(false,true)
        }

        domovoi_heard(domovoi_msg)
        running_log[cur_idx]["Domo"] = domovoi_msg
        reset_voice_status()
    }
    else if(vtext.startsWith('難易度')){
        document.getElementById("voice_recognition_status").className = null
        document.getElementById("voice_recognition_status").style.backgroundImage = "url(imgs/mic-recognized.png)"
        console.log("Recognized evidence set command")
        running_log[cur_idx]["Type"] = "難易度"
        console.log(`Heard '${vtext}'`)
        vtext = vtext.replace('難易度', "").trim()
        domovoi_msg += "難易度: "

        var smallest_num = "3"
        var smallest_val = 100
        var prev_value = document.getElementById("num_evidence").value
        var all_difficulty = ["カスタム","アポカリプス","インサニティ","ナイトメア","プロ","セミプロ","アマチュア"]

        for(var i = 0; i < all_difficulty.length; i++){
            var leven_val = levenshtein_distance(all_difficulty[i],vtext)
            if(leven_val < smallest_val){
                smallest_val = leven_val 
                smallest_num = all_difficulty[i]
            }
        }
        domovoi_msg += smallest_num

        smallest_num = {"カスタム":"-1","アポカリプス":"0","インサニティ":"1","ナイトメア":"2","プロ":"3","セミプロ":"3I","アマチュア":"3A"}[smallest_num]
        document.getElementById("num_evidence").value =  smallest_num
        if(prev_value != smallest_num){
            filter()
            updateMapDifficulty(smallest_num)
            showCustom()
            flashMode()
            setGhostSpeedFromDifficulty(smallest_num)
            bpm_calc(true)
            saveSettings()
        }
        domovoi_heard(domovoi_msg)
        running_log[cur_idx]["Domo"] = domovoi_msg
        reset_voice_status()
    }
    else if(vtext.startsWith('表示 ツール') || vtext.startsWith('表示 フィルター')){
        document.getElementById("voice_recognition_status").className = null
        document.getElementById("voice_recognition_status").style.backgroundImage = "url(imgs/mic-recognized.png)"
        console.log("Recognized filter/tool command")
        running_log[cur_idx]["Type"] = "ツール'/フィルター"
        console.log(`Heard '${vtext}'`)
        domovoi_msg += "トグル式メニュー"
        toggleFilterTools()
        domovoi_heard(domovoi_msg)
        running_log[cur_idx]["Domo"] = domovoi_msg
        reset_voice_status()
    }
    else if(vtext.startsWith('表示 マップ')){
        document.getElementById("voice_recognition_status").className = null
        document.getElementById("voice_recognition_status").style.backgroundImage = "url(imgs/mic-recognized.png)"
        console.log("Recognized map command")
        running_log[cur_idx]["Type"] = "表示 マップ"
        console.log(`Heard '${vtext}'`)
        vtext = vtext.replace('表示 マップ', "").trim()
        domovoi_msg = "表示 マップ: "

        var smallest_map = "tanglewood"
        var smallest_val = 100
        if(vtext != ""){
            // Common replacements for maps
            var prevtext = vtext;
            for (const [key, value] of Object.entries(ZNLANG['maps'])) {
                for (var i = 0; i < value.length; i++) {
                    if(vtext.includes(value[i])){vtext = vtext.replace(value[i],key)}
                }
            }
            var maps = document.getElementsByClassName("maps_button")
            for(var i = 0; i < maps.length; i++){
                var leven_val = levenshtein_distance(maps[i].id.toLowerCase(),vtext)
                if(leven_val < smallest_val){
                    smallest_val = leven_val 
                    smallest_map = maps[i].id
                }
            }
            console.log(`${prevtext} >> ${vtext} >> ${smallest_map}`)
            running_log[cur_idx]["Debug"] = `${prevtext} >> ${vtext} >> ${smallest_map}`
            domovoi_msg += `: ${smallest_map}`
        }
        changeMap(document.getElementById(smallest_map),all_maps[smallest_map])
        showMaps(true,false)
        domovoi_heard(domovoi_msg)
        running_log[cur_idx]["Domo"] = domovoi_msg
        reset_voice_status()
    }
    else if(vtext.startsWith('選択 マップ')){
        document.getElementById("voice_recognition_status").className = null
        document.getElementById("voice_recognition_status").style.backgroundImage = "url(imgs/mic-recognized.png)"
        console.log("Recognized map command")
        running_log[cur_idx]["Type"] = "選択 マップ"
        console.log(`Heard '${vtext}'`)
        vtext = vtext.replace('選択 マップ', "").trim()
        domovoi_msg = "選択 マップ:"

        var smallest_map = "tanglewood"
        var smallest_val = 100

        if(vtext != ""){

            // Common replacements for maps
            var prevtext = vtext;
            for (const [key, value] of Object.entries(ZNLANG['maps'])) {
                for (var i = 0; i < value.length; i++) {
                    if(vtext.includes(value[i])){vtext = vtext.replace(value[i],key)}
                }
            }

            var maps = document.getElementsByClassName("maps_button")

            for(var i = 0; i < maps.length; i++){
                var leven_val = levenshtein_distance(maps[i].id.toLowerCase(),vtext)
                if(leven_val < smallest_val){
                    smallest_val = leven_val 
                    smallest_map = maps[i].id
                }
            }
            console.log(`${prevtext} >> ${vtext} >> ${smallest_map}`)
            running_log[cur_idx]["Debug"] = `${prevtext} >> ${vtext} >> ${smallest_map}`
            domovoi_msg += `: ${smallest_map}`
        }

        changeMap(document.getElementById(smallest_map),all_maps[smallest_map])

        domovoi_heard(domovoi_msg)
        running_log[cur_idx]["Domo"] = domovoi_msg
        reset_voice_status()
    }
    else if(vtext.startsWith('クローズ マップ') || vtext.startsWith('非表示 マップ')){
        document.getElementById("voice_recognition_status").className = null
        document.getElementById("voice_recognition_status").style.backgroundImage = "url(imgs/mic-recognized.png)"
        console.log("Recognized map command")
        running_log[cur_idx]["Type"] = "maps"
        console.log(`Heard '${vtext}'`)
        domovoi_msg = "クローズ マップ"

        showMaps(false, true)

        domovoi_heard(domovoi_msg)
        running_log[cur_idx]["Domo"] = domovoi_msg
        reset_voice_status()
    }
    else if(vtext.startsWith('リセット ジャーナル') || vtext.startsWith('リセット チートシート')){
        document.getElementById("voice_recognition_status").className = null
        document.getElementById("voice_recognition_status").style.backgroundImage = "url(imgs/mic-recognized.png)"
        console.log("Recognized reset command")
        console.log(`Heard '${vtext}'`)
        reset()
    }
    else if(vtext.startsWith('ストップ 入力')){
        document.getElementById("voice_recognition_status").className = null
        document.getElementById("voice_recognition_status").style.backgroundImage = "url(imgs/mic-recognized.png)"
        console.log("Recognized stop listening command")
        console.log(`Heard '${vtext}'`)
        stop_voice()
    }
    else if(
        vtext.startsWith("こんにちは")
    ){
        domovoi_heard("こんにちは！")
        
        reset_voice_status()
    }
    else if(
        vtext.startsWith("move domo") || vtext.startsWith("move domovoi")|| vtext.startsWith("move zero") ||
        vtext.startsWith("domo move") || vtext.startsWith("domovoi move")|| vtext.startsWith("zero move")
    ){
        if (user_settings['domo_side'] == 0){
            $("#domovoi").addClass("domovoi-flip")
            $("#domovoi-img").addClass("domovoi-img-flip")
        }
        else{
            $("#domovoi").removeClass("domovoi-flip")
            $("#domovoi-img").removeClass("domovoi-img-flip")
        }
        saveSettings()
        
        reset_voice_status()
    }
    else{
        document.getElementById("voice_recognition_status").className = null
        document.getElementById("voice_recognition_status").style.backgroundImage = "url(imgs/mic-not-recognized.png)"
        domovoi_not_heard()
        reset_voice_status()
    }


}

if (("webkitSpeechRecognition" in window || "speechRecognition" in window) && !navigator.userAgent.toLowerCase().match(/firefox|fxios|opr/) && !('brave' in navigator)) {
    let speechRecognition = new webkitSpeechRecognition() || new speechRecognition();
    let stop_listen = true
  
    speechRecognition.continuous = false;
    speechRecognition.interimResults = false;
    speechRecognition.lang = 'ja';
  
    speechRecognition.onend = () => {
        if(!stop_listen){
            speechRecognition.start(auto=true);
        }
    }

    speechRecognition.onspeechstart = () =>{
        document.getElementById("voice_recognition_status").className = null
        document.getElementById("voice_recognition_status").style.backgroundImage = "url(imgs/mic-listening.png)"
    }

    speechRecognition.onerror = (error) =>{
        if(error.error != "no-speech")
            console.log(error)
    }
  
    speechRecognition.onresult = (event) => {
        let final_transcript = "";
  
        for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
                final_transcript = event.results[i][0].transcript;
            }
        }

        final_transcript = final_transcript.replace(/[.,;:-]/g, '')
        parse_speech(final_transcript);
    };
    
    function start_voice(auto=false){
        stop_listen = false
        if(!auto){
            document.getElementById("start_voice").disabled = true
            document.getElementById("stop_voice").disabled = false
            document.getElementById("voice_recognition_status").style.backgroundImage = "url(imgs/mic.png)";
            document.getElementById("voice_recognition_status").className = "pulse_animation"
            document.getElementById("voice_recognition_status").style.display = "block"
            $("#domovoi").show()
            setCookie("voice_recognition_on",true,0.0833)
        }
        speechRecognition.start();
    }

    function stop_voice(){
        stop_listen = true
        document.getElementById("start_voice").disabled = false
        document.getElementById("stop_voice").disabled = true
        document.getElementById("voice_recognition_status").style.display = "none"
        setCookie("voice_recognition_on",false,-1)
        $("#domovoi").hide()
        speechRecognition.stop();
    }

  } else {
    document.getElementById("start_voice").disabled = true
    document.getElementById("stop_voice").disabled = true
    document.getElementById("start_voice").style.display = "none"
    document.getElementById("stop_voice").style.display = "none"
    document.getElementById("voice_recognition_note").innerHTML = "非サポートされたブラウザー"
    console.log("Speech Recognition Not Available");
  }

