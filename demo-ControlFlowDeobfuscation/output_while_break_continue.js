function test(next) {
    while (1) {
        switch (next) {
            case 1:
                console.log("start");
                i = 1;
                while (i < 10) {
                    i++;
                    console.log("in");
                    if (i === 4) {
                        console.log("continue");
                    } else {
                        if (i === 7) {
                            console.log("break");
                            console.log("end");
                            return;
                        }
                        console.log(i);
                    }
                }
                console.log("end");
                return;
        }
    }
}
test(1);
