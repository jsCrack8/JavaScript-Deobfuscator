/*
console.log("start");
let i = 1;
while(i<10){
    i++;
    console.log("in");
    if(i===4){
        console.log("continue");
        continue;
    }
    if(i===7){
        console.log("break");
        break;
    }
    console.log(i);
}
console.log("end");
*/

function test(next){
    while(1){
        switch(next){
            case 1:
                console.log("start");
                next = 2;
                break;
            case 2:
                i=1;
                next=3;
                break;
            case 3:
                next = i<10 ? 4:11;
                break;
            case 4:
                i++;
                next = 5;
                break;
            case 5:
                console.log("in");
                next = 6;
                break;
            case 6:
                next = i===4 ? 7:8;
                break;
            case 7:
                console.log("continue");
                next = 3;
                break;
            case 8:
                next = i===7 ? 9:10;
                break;
            case 9:
                console.log("break");
                next = 11;
                break;
            case 10:
                console.log(i);
                next = 3;
                break;
            case 11:
                console.log("end");
                return;
                break;
        }
    }
}

test(1);
