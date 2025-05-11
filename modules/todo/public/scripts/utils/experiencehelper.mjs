function levelforexperience(experience) {
    let level = 0; // Hier geht nur vorwärts rechnen, weil die Gleichung e = l^3 + 100*l nicht nach l aufgelöst werden kann
    while (minexperiencefornextlevel(level) <= experience) level++;
    return level;
}

function minexperienceforthislevel(level) {
    return minexperiencefornextlevel(level - 1);
}

function minexperiencefornextlevel(level) {
    return level * level * level + 100 * level;
}

function experienceinlevel(level) {
    return minexperiencefornextlevel(level + 1) - minexperiencefornextlevel(level);
}

function experiencepercentinlevel(experience) {
    const level = levelforexperience(experience);
    const allexpinlevel = experienceinlevel(level);
    const expinlevel = experience - minexperienceforthislevel(level);
    const percentage = 100 * expinlevel / allexpinlevel;
    return percentage;
}

export default { experiencepercentinlevel, levelforexperience, minexperienceforthislevel, minexperiencefornextlevel, experienceinlevel }