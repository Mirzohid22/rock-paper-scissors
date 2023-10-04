import crypto from "crypto";
import chalk from "chalk";
import readline from "readline";

class RPSGame {
  constructor(moves) {
    this.moves = moves;
    this.key = this.generateKey();
    this.computerMove = this.generateComputerMove();
    this.hmacValue = this.calculateHMAC(this.computerMove);
    this.combinations = {};
  }

  generateKey() {
    return crypto.randomBytes(32).toString("hex"); // 256 bits
  }

  generateComputerMove() {
    const randomIndex = Math.floor(Math.random() * this.moves.length);
    return this.moves[randomIndex];
  }

  calculateHMAC(move) {
    const hmac = crypto.createHmac("sha256", Buffer.from(this.key, "hex"));
    hmac.update(move, "utf-8");
    return hmac.digest("hex");
  }

  play() {
    console.log(chalk.bold(`HMAC: ${this.hmacValue}`));
    console.log(chalk.blue("Available moves:"));
    this.moves.forEach((move, index) => {
      console.log(chalk.bold(`${index + 1} - ${move}`));
    });
    console.log(chalk.bold("0 - exit"));
    console.log(chalk.bold("? - help"));

    this.getUserMove();
  }

  getUserMove() {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    rl.question(chalk.yellow("Enter your move: "), (userInput) => {
      const userMove = parseInt(userInput);
      if (userInput === "0") {
        console.log(chalk.yellow("Exiting the game."));
        rl.close();
      } else if (userInput === "?") {
        this.displayHelp();
        rl.close();
      } else if (
        !isNaN(userMove) &&
        userMove >= 1 &&
        userMove <= this.moves.length
      ) {
        this.displayResult(userMove);
        rl.close();
      } else {
        console.log(chalk.red("Invalid input. Please try again."));
        this.getUserMove();
      }
    });
  }

  displayResult(userMove) {
    const userMoveText = this.moves[userMove - 1];
    const computerMoveText = this.computerMove;

    const halfMoves = Math.floor(this.moves.length / 2);
    const winningMoves = [
      ...this.moves.filter((move) => move !== userMoveText),
      ...this.moves.filter((move) => move !== userMoveText),
    ].slice(userMove - 1, userMove - 1 + halfMoves);
    this.winningMoves = winningMoves;
    const losingMoves = [
      ...this.moves.filter((move) => move !== userMoveText),
      ...this.moves.filter((move) => move !== userMoveText),
    ].slice(userMove - 1 + halfMoves, userMove - 1 + halfMoves + halfMoves);
    this.losingMoves = losingMoves;
    let result;
    if (winningMoves.includes(computerMoveText)) {
      result = chalk.green("You win!");
    } else if (losingMoves.includes(computerMoveText)) {
      result = chalk.red("Computer wins!");
    } else {
      result = chalk.yellow("It's a draw!");
    }

    console.log(chalk.bold(`Your move: ${userMoveText}`));
    console.log(chalk.bold(`Computer move: ${computerMoveText}`));
    console.log(result);
    console.log(chalk.bold(`HMAC key: ${this.key}`));
  }

  generateCombinations() {
    for (let move of this.moves) {
      this.combinations[move] = { wins: [], loses: [] };
    }

    for (let user = 1; user <= this.moves.length; user++) {
      const userMove = this.moves[user - 1];
      const halfMoves = Math.floor(this.moves.length / 2);
      const winningMoves = [
        ...this.moves.filter((move) => move !== userMove),
        ...this.moves.filter((move) => move !== userMove),
      ].slice(user - 1, user - 1 + halfMoves);
      const losingMoves = [
        ...this.moves.filter((move) => move !== userMove),
        ...this.moves.filter((move) => move !== userMove),
      ].slice(user - 1 + halfMoves, user - 1 + halfMoves + halfMoves);
      this.combinations[userMove].wins = winningMoves;
      this.combinations[userMove].loses = losingMoves;
    }

    console.log(this.combinations);
  }

  displayHelp() {
    this.generateCombinations();
    const table = [];
    const headerRow = [chalk.bold("User ")];
    const headerDivider = [];

    // Create header row with colored text
    this.moves.forEach((move) => {
      headerRow.push(chalk.bold.blue(move));
    });

    table.push(headerRow);

    // Fill in the table with game outcomes
    for (let i = 0; i < this.moves.length; i++) {
      const row = [chalk.bold.blue(this.moves[i])]; // left
      for (let j = 0; j < this.moves.length; j++) {
        if (i === j) {
          row.push(chalk.bold.bgYellowBright("Draw "));
        } else if (
          this.combinations[this.moves[i]].wins.includes(this.moves[j])
        ) {
          row.push(chalk.bold.bgGreen(" Win "));
        } else {
          row.push(chalk.bold.bgRed("Lose "));
        }
      }
      table.push(row);
    }

    console.log("Game rules:");
    console.log(this.formatTable(table));
  }

  formatTable(table) {
    let formattedTable = "";

    table.forEach((row) => {
      const reg = "| " + row.join(" | ") + " |\n";
      formattedTable += reg + "+" + "-".repeat(reg.length - 2) + "+\n";
    });
    formattedTable =
      "+" +
      "-".repeat(formattedTable.indexOf("\n") - 1) +
      "+\n" +
      formattedTable;
    return formattedTable;
  }
}

if (
  process.argv.length < 4 ||
  process.argv.length % 2 === 0 ||
  new Set(process.argv.slice(2)).size !== process.argv.length - 2
) {
  console.log(
    chalk.red(
      "Incorrect arguments. Please provide an odd number of unique moves."
    )
  );
  console.log(chalk.yellow("Example: node game.js rock scissors paper"));
  process.exit(1);
}

const moves = process.argv.slice(2);
const game = new RPSGame(moves);
game.play();
