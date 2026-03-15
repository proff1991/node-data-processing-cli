export var tokenize = (input) => {

    var tokens = [];
    var regex = /"([^"]*)"|[^\s]+/g;
    var match = []; // initial value with the same type for better optimization

    while ((match = regex.exec(input)) !== null) {

        if (match[1] !== undefined) {
            tokens.push(match[1]);
        } else {
            tokens.push(match[0]);
        }

    }

    return tokens;

};