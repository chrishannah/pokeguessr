#!/usr/bin/env node

import inquirer from "inquirer";
import chalk from "chalk";
import pokemonList from './pokemon.js';

const TOTAL_COLUMNS = 6;

let revealed = []

async function gameLoop() {
    while (revealed.length < 151) {
        console.clear();
        console.log(chalk.green(`Guessed ${revealed.length}/151`));
        printPokemonList(pokemonList, revealed);

        const answers = await inquirer.prompt([
            {
                type: 'input',
                name: 'guess',
                message: 'Enter Pokémon name:',
                validate: function(input) {
                    if (!input) {
                        return 'Please enter a Pokémon name.';
                    }
                    return true;
                }
            }
        ]);

        const guess = answers.guess.trim().toLowerCase();
        const alreadyFound = revealed.find(pokemon => pokemon.name.toLowerCase() === guess);
        const result = pokemonList.find(pokemon => pokemon.name.toLowerCase() === guess);

        if (result && !alreadyFound) {
            revealed.push(result);
        }

        console.log(guess);

    }
}

function printPokemonList(all, revealed) {
    const pokemon = all.map(pokemon => {
        const found = revealed.find(rev => rev.number === pokemon.number);
        const entry = found ? `${pokemon.number}: ${pokemon.name}` : `${pokemon.number}:`;
        return entry.padEnd(20, ' ');
    });

    const rows = Math.ceil(pokemon.length / TOTAL_COLUMNS);

    for (let r = 0; r < rows; r++) {
        let row = [];

        for (let c = 0; c < TOTAL_COLUMNS; c++) {
            const idx = c * rows + r;
            if (idx < pokemon.length) {
                row.push(pokemon[idx]);
            }

        }
        console.log(row.join('    '));
    }
}

gameLoop();
