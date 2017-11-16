
function sideEffect(modifies, leavesAlone) {
    modifies.x = 1;

    if (modifies.y = 2) {
        modifies.z = 3;
    }

    switch(modifies.x) {
        case 1:
            modifies.x = 4;
            break;
        default:
            modifies.x = 5
    }

    return leavesAlone;
}

/*
function noEffects(noModify, alsoNoModify) {
    const me = 12;
    return me;
}
*/