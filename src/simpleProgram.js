
function sideEffect(modifies, leavesAlone) {
    modifies.x = 12;
    return leavesAlone;
}

/*
function noEffects(noModify, alsoNoModify) {
    const me = 12;
    return me;
}
*/