#!/usr/bin/env node

import inquirer from "inquirer";
import chalk from "chalk";
import pokemonList from "./pokemon.js";
import process from "node:process";

const TOTAL_COLUMNS = 6;

const revealed = [];

async function gameLoop() {
    while (revealed.length < 151) {
        printPokemonList(pokemonList, revealed);

        const answers = await inquirer.prompt([
            {
                type: "input",
                name: "guess",
                message: "Enter Pokémon name:",
                validate: function(input) {
                    if (!input) {
                        return "Please enter a Pokémon name.";
                    }
                    return true;
                },
            },
        ]);

        const guess = answers.guess.trim().toLowerCase();
        const found = pokemonList.filter((pokemon) =>
            pokemon.name.toLowerCase() === guess
        );
        const alreadyFound = revealed.find((pokemon) =>
            pokemon.name.toLowerCase() === guess
        );

        // Already found
        if (alreadyFound) {
            console.log(chalk.yellow(`Already guessed: ${found[0].name}`));
        }

        if (found.length > 0 && !alreadyFound) {
            // Correct
            console.log(chalk.green(`Correct: ${found[0].name}`));
            revealed.push(...found);
        } else {
            // Incorrect
            console.log(chalk.red(`Incorrect: ${answers.guess}`));
        }

        // Wait 0.6s (can still input during time)
        await new Promise((resolve) => setTimeout(resolve, 600));
    }
}

function printPokemonList(all, revealed) {
    console.clear();
    console.log(chalk.green(`Guessed ${revealed.length}/151`));

    const pokemon = all.map((pokemon) => {
        const found = revealed.find((rev) => rev.number === pokemon.number);
        const entry = found
            ? `${pokemon.number}: ${pokemon.name}`
            : `${pokemon.number}:`;
        return entry.padEnd(20, " ");
    });

    const rows = Math.ceil(pokemon.length / TOTAL_COLUMNS);

    for (let r = 0; r < rows; r++) {
        const row = [];

        for (let c = 0; c < TOTAL_COLUMNS; c++) {
            const idx = c * rows + r;
            if (idx < pokemon.length) {
                row.push(pokemon[idx]);
            }
        }
        console.log(row.join("    "));
    }

    if (all.length === revealed.length) {
        console.log(
            chalk.green("Congratulations, you have found all 151 Pokémon!"),
        );
        process.exit(0);
    }
}

gameLoop();
