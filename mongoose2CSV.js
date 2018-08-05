/*
   # Mongoose2CSV
NodeJ.S 에서 mongoose(몽고DB)의 데이터들을 CSV파일로 뽑아내는 모듈 (log데이터 등을 뽑아낼때 유용)

Node.JS Mongoose to CSV File
원하는 인자만, 원하는 Date 형태로 (moment 이용) 파일 생성

-- 인자 설명 5개 --
파일이름, response(res), collection 배열, 미리 넣어둘 string, 출력할 스키마 배열
조인 일 경우 연속 적인 joinProperty배열 활용, 배열 일 경우 arrProperty배열 활용
titleSpace는 열의 이름들을 위해 정함(array일 경우 array크기만큼 추가 셀을 이용하므로 titleSpace를 통해 추가 셀 배정)

join일 경우 반드시 원하는 schema를 포함한 joinProperty속성을 포함한 배열을
Array일 경우 원하는 schema를 포함한 arrProperty속성을 포함한 배열을 넣어야 하고

추가로 Date일 경우 원하는 타입을 dateFormat에 넣어주어야 함(안 넣으면 원래 형식대로 출력)

예시:
mongoose2CSV.mongoose2CSV('noticeboard.csv', res, data, "",[{name:'numId'}, {name:'title'}, {name:'body'}, 
      {name:'author', joinProperty:[{name: 'nickname'}, {name: 'email'}], titleSpace:2}, {name:'createdAt', dateFormat:'YYYY[-]MM[-]DD HH[:]mm[:]ssZ'},
      {name:'comments', arrProperty:[{name:'author', joinProperty:[{name: 'nickname'}, {name: 'email'}]},{name: 'body'}, {name:'createdAt', dateFormat:'YYYY[-]MM[-]DD HH[:]mm[:]ssZ'}], titleSpace:2}]);


-한계 

배열 일 경우에 대해 배열 속 배열은 지원x
배열 속 속성에 대해 join은 1번만 지원
join된 속성에서 array가 있는 경우 지원x

(내용 모두 출력은 하게 구현 할 수 있지만 셀에서 보여지는 모습의 문제 때문에 보류 중)

/* Copyright (C) 2018 by Son J.W*/

var mime = require('mime');
var Readable = require('stream').Readable;
var moment = require('moment');

exports.mongoose2CSV = function(fileName, response, collections, preString, schema){
  var str = new Readable();
  var mimetype = mime.lookup(fileName);   // for mimetype extract from .csv
  
  response.setHeader('Content-disposition', 'attachment; filename=' + fileName);
  response.setHeader('Content-type', mimetype + ";charset=utf-8");  // for UTF-8 Support
  str.pipe(response);

  processString = function(p_string){ return '"' + p_string.replace(/"/gm,"\"\"") + '"';};

  var s_len = schema.length;
  
  // for UTF-8 Support + modelname
  str.push("\uFEFF<" + preString + "\n");

  str.push(collections[0].__proto__.constructor.modelName + ">\n");

  // schema name display  * : join, [] : array  join and array component in one cell (because of join join join(array) etc...)
  var str_temp = "";
  for(var i = 0; i < s_len; i++){
    (schema[i].joinProperty != null) ? str_temp += "*" + schema[i].name + ",".repeat(schema[i].titleSpace-1) : str_temp += schema[i].name;
    (schema[i].arrProperty != null) ? str_temp += '[],'  + ",".repeat(schema[i].titleSpace-1) : str_temp += ','
  }
  str_temp += '\n';
  str.push(str_temp);
  
  var c_len = collections.length;
  for(var i = 0; i < c_len; i++){
    for(var j = 0; j < s_len; j++){
      var _collection = collections[i][schema[j].name];
      // for Join
      if(schema[j].arrProperty != null){
        var a_len = _collection.length;
        var p_len = schema[j].arrProperty.length;
        for(var k = 0; k < a_len; k++){
          str_temp = "[" + k + "]->\n";
          for(var s = 0; s < p_len; s++){
            if(schema[j].arrProperty[s].joinProperty != null){ 
              var __collection = _collection[k][schema[j].arrProperty[s].name];
              var joinProperty = schema[j].arrProperty[s].joinProperty;
              var columnName = "*"+schema[j].arrProperty[s].name; 
              var len = joinProperty.length;
              for(var r = 0; r < len; r++){
                if(__collection[joinProperty[r].dateFormat] != null){
                  str_temp += columnName+ "." + joinProperty[r].name + ": " + moment(__collection[joinProperty[r].name]).format(__collection[joinProperty[r].dateFormat]) + '\n';
                  continue;
                }
                str_temp += columnName+ "." + joinProperty[r].name + ": " + __collection[joinProperty[r].name] + '\n';
              }
              //processJoin(_collection[k][schema[j].arrProperty[s].name], schema[j].arrProperty[s].joinProperty, "*"+schema[j].arrProperty[s].name, str);
            }
            else {
              if(schema[j].arrProperty[s].dateFormat != null){
                str_temp += schema[j].arrProperty[s].name + ": " + moment(_collection[k][schema[j].arrProperty[s].name]).format(schema[j].arrProperty[s].dateFormat) + '\n';
                continue;
              }
              str_temp += schema[j].arrProperty[s].name + ": " + _collection[k][schema[j].arrProperty[s].name] + '\n';
            }
          }
          str.push(processString(str_temp) + ',');
        }
      }

      else if(schema[j].joinProperty != null){
        processJoin(_collection, schema[j].joinProperty, "", str);
      }
      //
      else {
        if(typeof(_collection) == 'string'){
          str.push(processString(_collection) + ',');
          continue;
        }
        if(schema[j].dateFormat != null){
          str.push(moment(_collection).format(schema[j].dateFormat) + ',');
          continue;
        }
        str.push(_collection + ',');
      }
    }
    str.push('\n');
  }
  str.push(null);
};

// 양쪽을 "로 묶으면 한개의 셀로 인식 (내부 "가 있으면 ""로 변경하면 됨)
exports.processString = function(p_string){
  return '"' + p_string.replace(/"/gm,"\"\"") + '"';
};

// 연속된 조인일 경우 .A.B.C: value 이런식으로 표기
function processJoin(_collection, joinProperty, columnName, str){
  var len = joinProperty.length;
  for(var i = 0; i < len; i++){
    // for Join 계속되는 join을 해결 가능
    if(joinProperty[i].joinProperty != null){
      processJoin(_collection[joinProperty[i].name], joinProperty[i].joinProperty, columnName+ ".*" + joinProperty[i].name, str);
    }
    //
    else {
      if(typeof(joinProperty[i].name) == 'string'){
        str.push(processString(columnName+ "." + joinProperty[i].name + ": " + _collection[joinProperty[i].name]) + ',');
        continue;
      }
      if(joinProperty[i].dateFormat != null){
        str.push(columnName+ "." + joinProperty[i].name + ": " + moment(_collection[joinProperty[i].name]).format(joinProperty[i].dateFormat) + ',');
        continue;
      }
      str.push(columnName+ "." + joinProperty[i].name + ": " + _collection[joinProperty[i].name] + ',');
    }
  }
}