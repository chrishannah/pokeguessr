#!/usr/bin/env node

import inquirer from "inquirer";
import chalk from "chalk";
import pokemonList from "./pokemon.js";
import process from "node:process";

const ENTRY_WIDTH = 20; // Width of each Pokémon entry
const COLUMN_SPACING = 4; // Spaces between columns
const MIN_COLUMNS = 2; // Minimum columns for readability
const MAX_COLUMNS = 10; // Maximum columns to prevent overcrowding

const revealed = [];
let shouldRedraw = false;

// Calculate optimal number of columns based on terminal width
function calculateColumns() {
    const terminalWidth = process.stdout.columns || 80; // Default to 80 if not available
    // Each column needs ENTRY_WIDTH chars, plus COLUMN_SPACING (except last column)
    // Formula: (width + spacing) / (entry_width + spacing)
    const columns = Math.floor((terminalWidth + COLUMN_SPACING) / (ENTRY_WIDTH + COLUMN_SPACING));
    return Math.max(MIN_COLUMNS, Math.min(MAX_COLUMNS, columns));
}

// Handle terminal resize events
process.stdout.on('resize', () => {
    shouldRedraw = true;
});

async function gameLoop() {
    while (revealed.length < 151) {
        printPokemonList(pokemonList, revealed);
        shouldRedraw = false; // Reset redraw flag after printing

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
        return entry.padEnd(ENTRY_WIDTH, " ");
    });

    const columns = calculateColumns();
    const rows = Math.ceil(pokemon.length / columns);

    for (let r = 0; r < rows; r++) {
        const row = [];

        for (let c = 0; c < columns; c++) {
            const idx = c * rows + r;
            if (idx < pokemon.length) {
                row.push(pokemon[idx]);
            }
        }
        console.log(row.join(" ".repeat(COLUMN_SPACING)));
    }

    if (all.length === revealed.length) {
        console.log(
            chalk.green("Congratulations, you have found all 151 Pokémon!"),
        );
        process.exit(0);
    }
}

gameLoop();
