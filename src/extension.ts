import * as vscode from 'vscode';

let statusItem: vscode.StatusBarItem;
let problems: string[] = [];
let currentScore = 100;

export function activate(context: vscode.ExtensionContext) {
    
    // 1. Create Status Bar
    statusItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 0);
    statusItem.command = 'grade-guardian.showReport';
    context.subscriptions.push(statusItem);

    // 2. Register Command (Click to see report)
    const reportCmd = vscode.commands.registerCommand('grade-guardian.showReport', () => {
        if (currentScore === 100) {
            vscode.window.showInformationMessage(`🏆 Clean Code! 100/100. Good luck.`);
        } else {
            vscode.window.showQuickPick(problems, {
                placeHolder: `Score: ${currentScore}/100. Issues detected:`
            });
        }
    });
    context.subscriptions.push(reportCmd);

    // 3. Listeners
    const runAnalysis = () => analyzeCode();
    
    context.subscriptions.push(vscode.window.onDidChangeActiveTextEditor(runAnalysis));
    context.subscriptions.push(vscode.workspace.onDidChangeTextDocument(runAnalysis));
    context.subscriptions.push(vscode.workspace.onDidChangeConfiguration(runAnalysis));

    if (vscode.window.activeTextEditor) {
        runAnalysis();
    }
}

function analyzeCode() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        statusItem.hide();
        return;
    }

    const text = editor.document.getText();
    // Safety check for TS type
    const configName = vscode.workspace.getConfiguration('gradeGuardian').get<string>('studentName', '');
    
    currentScore = 100;
    problems = [];
    let isFatal = false;

    // --- RULE 1: ABSOLUTE PATHS (The "It works on my machine" killer) ---
    // Matches: "C:\Users", "/home/user", "/Users/jawad"
    const absPathRegex = /("|')\s*(C:\\Users|\/home\/|\/Users\/)/i;
    if (absPathRegex.test(text)) {
        currentScore -= 40;
        isFatal = true;
        problems.push("🚨 CRITICAL: Absolute Path found (e.g. C:/Users). Use relative paths.");
    }

    // --- RULE 2: DEBUG PRINTS (The "TLE" Killer in DSA) ---
    // - JS: console.log
    // - Java: System.out.println, e.printStackTrace
    // - C++: cout, cerr, printf
    // - Python: print(...)
    // - Go: fmt.Print
    // - Rust: println!
    const printRegex = /\b(console\.log|System\.out\.print|e\.printStackTrace|fmt\.Print|print\s*\(|std::cout|cout\s*<<|cerr\s*<<|printf|println!)\b/;
    
    // Bonus: Check if print is inside a Loop (High TLE Risk)
    // Matches "for" or "while", then some text, then a print statement
    const loopPrintRegex = /(for|while)[\s\S]{0,100}\{(?:[^{}]*)\b(console\.log|cout|System\.out\.print|print\()/;

    if (loopPrintRegex.test(text)) {
        currentScore -= 25;
        problems.push("🐢 SLOW CODE: Printing inside a loop causes TLE in DSA!");
    } else if (printRegex.test(text)) {
        currentScore -= 10;
        problems.push("⚠️ Remove debug print statements.");
    }

    // --- RULE 3: EMPTY ERROR HANDLING (The "Silent Fail") ---
    // - JS/Java/C++: catch (...) { }
    // - Python: except ...: pass
    const emptyCatchRegex = /(\bcatch\s*\(.*?\)\s*\{\s*\}|\bexcept\s*.*:\s*pass)/;
    if (emptyCatchRegex.test(text)) {
        currentScore -= 15;
        problems.push("☠️ Empty catch/except block. Don't hide errors.");
    }

    // --- RULE 4: SPAGHETTI CODE (Complexity Check) ---
    // 16 spaces or 4 tabs of indentation
    const deepIndent = /^\s{16,}/m;
    if (deepIndent.test(text)) {
        currentScore -= 10;
        problems.push("🍝 Spaghetti Code detected (Deep Nesting). Break into functions.");
    }

    // --- RULE 5: TODO COMMENTS ---
    if (/(\/\/|#)\s*(TODO|FIXME)/i.test(text)) {
        currentScore -= 5;
        problems.push("📝 You have unfinished TODOs.");
    }

    // --- RULE 6: MISSING NAME HEADER ---
    if (configName && configName.trim() !== "") {
        // Check only top 10 lines
        const header = text.split('\n').slice(0, 10).join('\n');
        if (!header.includes(configName)) {
            currentScore -= 5;
            problems.push(`📛 Name missing. Add '${configName}' to top of file.`);
        }
    }

    updateUI(isFatal);
}

function updateUI(isFatal: boolean) {
    if (currentScore < 0) { currentScore = 0; }

    statusItem.text = `Grade: ${currentScore}/100`;

    if (currentScore === 100) {
        statusItem.color = '#50fa7b'; // Green
        statusItem.text = `$(verified) Grade: 100`;
        statusItem.tooltip = "Excellent! Ready to submit.";
    } else if (isFatal || currentScore < 60) {
        statusItem.color = '#ff5555'; // Red
        statusItem.text = `$(error) Grade: ${currentScore}`;
        statusItem.tooltip = "FAIL: Click to see errors.";
    } else {
        statusItem.color = '#ffb86c'; // Orange
        statusItem.tooltip = "Warning: Click to fix issues.";
    }
    statusItem.show();
}

export function deactivate() {}