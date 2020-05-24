module.exports = {
  parseDateWithRegex: function(value) {
    
    /*console.log(value);
    //var matches = value.match(/^(\d{2})\.(\d{2})\.(\d{4}) (\d{2}):(\d{2}):(\d{2})$/);
    var matches = value.match(/^(\d{2})-(\d{2})-(\d{4}) (\d{2}):(\d{2})$/);
    //alt:
    // value.match(/^(\d{2}).(\d{2}).(\d{4}).(\d{2}).(\d{2}).(\d{2})$/);
    // also matches 22/05/2013 11:23:22 and 22a0592013,11@23a22
    if (matches === null) {
      return null;
    } else {
      // now lets check the date sanity
      var year = parseInt(matches[3], 10);
      var month = parseInt(matches[2], 10) - 1; // months are 0-11
      var day = parseInt(matches[1], 10);
      var hour = parseInt(matches[4], 10);
      var minute = parseInt(matches[5], 10);
      var second = parseInt(matches[6], 10);
      var date = new Date(year, month, day, hour, minute, second);
      if (
        date.getFullYear() !== year ||
        date.getMonth() != month ||
        date.getDate() !== day ||
        date.getHours() !== hour ||
        date.getMinutes() !== minute ||
        date.getSeconds() !== second
      ) {
        return null;
      } else {
        return date;
        // valid
      }
    }*/
    
    const [data, horario] = value.split(" ");
    const [diaStr, mesStr, anoStr] = data.split("-");
    const [horaStr, minutoStr] = horario.split(":");
    
    //console.log(diaStr,mesStr,anoStr,horaStr,minutoStr);
    
    let dia, mes, ano, hora, minuto;
    
    if(diaStr.length === 2 && diaStr.startsWith("0")){
      
      dia = parseInt(diaStr[1]);
      
    }
    else if(parseInt(diaStr) <= 31){dia = parseInt(diaStr)}
    else return null;
    
    if(mesStr.length === 2 && mesStr.startsWith("0")){
      
      mes = parseInt(mesStr[1]);
      
    }
    else if(parseInt(mesStr) <= 12){mes = parseInt(mesStr)}
    else return null;
    
    if(anoStr.length !== 4) return null;
    else ano = parseInt(anoStr);
    
    
    if(horaStr.length === 2 && horaStr.startsWith("0")){
      
      hora = parseInt(horaStr[1]);
      
    }
    else if(parseInt(horaStr) <= 23){hora = parseInt(horaStr)}
    else return null;
    
    if(minutoStr.length === 2 && minutoStr.startsWith("0")){
      
      minuto = parseInt(minutoStr[1]);
      
    }
    else if(parseInt(horaStr) <= 59){minuto = parseInt(minutoStr)}
    else return null;
    
    //console.log(dia,mes,ano,hora,minuto);
    
    
    return new Date(ano, mes-1, dia, hora, minuto);
  }
};