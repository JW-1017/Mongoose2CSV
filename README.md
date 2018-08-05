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
