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
let startTime = null;
let timerInterval = null;

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

// Clean up timer on exit
process.on('exit', () => {
    if (timerInterval) {
        clearInterval(timerInterval);
    }
});

// Format elapsed time in a readable format
function formatTime(milliseconds) {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    const secs = seconds % 60;
    const mins = minutes % 60;

    if (hours > 0) {
        return `${hours}h ${mins}m ${secs}s`;
    } else if (minutes > 0) {
        return `${mins}m ${secs}s`;
    } else {
        return `${secs}s`;
    }
}

// Update the timer display in real-time
function updateTimer() {
    if (!startTime) return;

    const elapsed = Date.now() - startTime;
    const timeStr = formatTime(elapsed);

    // Save cursor position, move to first line, update time, restore cursor
    process.stdout.write('\x1b[s'); // Save cursor position
    process.stdout.write('\x1b[1;1H'); // Move to line 1, column 1
    process.stdout.write('\x1b[K'); // Clear line
    process.stdout.write(chalk.green(`Guessed ${revealed.length}/151`) + chalk.gray(` | Time: ${timeStr}`));
    process.stdout.write('\x1b[u'); // Restore cursor position
}

async function gameLoop() {
    startTime = Date.now();

    // Start the timer interval to update every second
    timerInterval = setInterval(updateTimer, 1000);

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

            // Check if we've completed all 151 - show completion immediately
            if (revealed.length === 151) {
                await new Promise((resolve) => setTimeout(resolve, 600));
                showCompletionScreen();
                process.exit(0);
            }
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

    const elapsed = startTime ? Date.now() - startTime : 0;
    const timeStr = formatTime(elapsed);

    console.log(chalk.green(`Guessed ${revealed.length}/151`) + chalk.gray(` | Time: ${timeStr}`));

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
}

function showCompletionScreen() {
    // Clear the timer interval
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }

    console.clear();

    const elapsed = Date.now() - startTime;
    const timeStr = formatTime(elapsed);

    // ASCII Art
    const art = `
${chalk.yellow('╔═══════════════════════════════════════════════════════════════╗')}
${chalk.yellow('║')}                                                               ${chalk.yellow('║')}
${chalk.yellow('║')}      ${chalk.green.bold('██████╗  ██████╗ ███╗   ██╗ ██████╗ ██████╗  █████╗ ████████╗███████╗')}      ${chalk.yellow('║')}
${chalk.yellow('║')}      ${chalk.green.bold('██╔════╝ ██╔═══██╗████╗  ██║██╔════╝ ██╔══██╗██╔══██╗╚══██╔══╝██╔════╝')}      ${chalk.yellow('║')}
${chalk.yellow('║')}      ${chalk.green.bold('██║  ███╗██║   ██║██╔██╗ ██║██║  ███╗██████╔╝███████║   ██║   ███████╗')}      ${chalk.yellow('║')}
${chalk.yellow('║')}      ${chalk.green.bold('██║   ██║██║   ██║██║╚██╗██║██║   ██║██╔══██╗██╔══██║   ██║   ╚════██║')}      ${chalk.yellow('║')}
${chalk.yellow('║')}      ${chalk.green.bold('╚██████╔╝╚██████╔╝██║ ╚████║╚██████╔╝██║  ██║██║  ██║   ██║   ███████║')}      ${chalk.yellow('║')}
${chalk.yellow('║')}      ${chalk.green.bold(' ╚═════╝  ╚═════╝ ╚═╝  ╚═══╝ ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝   ╚═╝   ╚══════╝')}      ${chalk.yellow('║')}
${chalk.yellow('║')}                                                               ${chalk.yellow('║')}
${chalk.yellow('╚═══════════════════════════════════════════════════════════════╝')}
`;

    console.log(art);
    console.log();
    console.log(chalk.green.bold('  🎉 You caught all 151 original Pokémon! 🎉'));
    console.log();
    console.log(chalk.cyan(`  ⏱️  Time: ${chalk.bold(timeStr)}`));
    console.log();
    console.log(chalk.gray('  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
    console.log();
    console.log(chalk.blue('  Share your time on social media!'));
    console.log();
    console.log(chalk.white(`  I caught all 151 Pokémon in ${timeStr}! 🎮✨`));
    console.log(chalk.white(`  Challenge: PokeGuessr`));
    console.log();
    console.log(chalk.gray('  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
    console.log();
    console.log(chalk.gray('  By @chrishannah'));
    console.log();
}

gameLoop();
