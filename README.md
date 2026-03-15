# node-data-processing-cli

## Start the project

```bash
npm run start
```

## Examples

To make it easier to check that the task has been completed correctly, I have left several example files: 
- data_example.csv
- file_example.txt

## Strange code style

My code style may seem a little strange because I use var instead of let/const, but this is due to the fact that var has less performance overhead and this project is written in js, not TS with the ability to transpile to "var". For the same reason, I use arrow functions, try to avoid for...of loops, assignments with array-style destructuring, and so on.