import * as vscode from 'vscode';

let statusItem: vscode.StatusBarItem;
// Global variable to hold problems list
let problems: string[] = [];
let currentScore = 100;

export function activate(context: vscode.ExtensionContext) {
    
    // 1. Create UI Elements
    statusItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 0);
    statusItem.command = 'grade-guardian.showReport';
    context.subscriptions.push(statusItem);

    // 2. Register Report Command (Clicking the score)
    const reportCmd = vscode.commands.registerCommand('grade-guardian.showReport', () => {
        if (currentScore === 100) {
            vscode.window.showInformationMessage(`🎉 Perfect Score! You are ready to submit.`);
        } else {
            vscode.window.showQuickPick(problems, {
                placeHolder: `Current Score: ${currentScore}/100. Fix these issues:`
            });
        }
    });
    context.subscriptions.push(reportCmd);

    // 3. Listeners
    const runAnalysis = () => analyzeCode();
    
    context.subscriptions.push(vscode.window.onDidChangeActiveTextEditor(runAnalysis));
    context.subscriptions.push(vscode.workspace.onDidChangeTextDocument(runAnalysis));
    context.subscriptions.push(vscode.workspace.onDidChangeConfiguration(runAnalysis));

    // Initial Run
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
    // FIX: Added <string> to tell Typescript this is definitely text
    const configName = vscode.workspace.getConfiguration('gradeGuardian').get<string>('studentName', '');
    
    currentScore = 100;
    problems = [];
    let isFatal = false;

    // --- RULE 1: THE ABSOLUTE PATH TRAP ---
    const absolutePathRegex = /("C:\\Users|'C:\\Users|"\/\w+\/|'\/\w+\/)/i;
    if (absolutePathRegex.test(text)) {
        currentScore -= 40;
        isFatal = true;
        problems.push("🚨 CRITICAL: Absolute Path found! Use relative paths.");
    }

    // --- RULE 2: DEBUG LEFTOVERS ---
    const logRegex = /(console\.log|System\.out\.print|fmt\.Println|Log\.d|print\s*\()/i;
    if (logRegex.test(text)) {
        currentScore -= 15;
        problems.push("⚠️ Remove 'print/console.log' statements.");
    }

    // --- RULE 3: LAZYNESS (TODOs) ---
    const todoRegex = /(\/\/|#|<!--)\s*(TODO|FIXME|XXX)/i;
    if (todoRegex.test(text)) {
        currentScore -= 10;
        problems.push("📝 Resolve TODO comments.");
    }

    // --- RULE 4: EMPTY CATCH BLOCKS ---
    const emptyCatch = /(catch|except)\s*\(.*?\)\s*\{\s*\}/;
    if (emptyCatch.test(text)) {
        currentScore -= 20;
        problems.push("☠️ Empty catch block detected. Don't hide errors.");
    }

    // --- RULE 5: SPAGHETTI INDENTATION ---
    const spaghettiRegex = /^\s{16,}/m;
    if (spaghettiRegex.test(text)) {
        currentScore -= 10;
        problems.push("🍝 Deep indentation (Spaghetti code). Refactor into functions.");
    }

    // --- RULE 6: MISSING HEADER ---
    // FIX: Using trim() is now safe because we forced it to be a string earlier
    if (configName && configName.trim() !== "") {
        const header = text.split('\n').slice(0, 10).join('\n'); 
        if (!header.includes(configName)) {
            currentScore -= 5;
            problems.push(`📛 Header missing. Add your name: '${configName}' to top of file.`);
        }
    }

    updateUI(isFatal);
}

function updateUI(isFatal: boolean) {
    // FIX: Added brackets {} to please the Linter
    if (currentScore < 0) { 
        currentScore = 0; 
    }

    statusItem.text = `Grade: ${currentScore}/100`;

    if (currentScore === 100) {
        statusItem.color = '#50fa7b'; // Green
        statusItem.text = `$(verified) Grade: 100`;
        statusItem.tooltip = "Ready to Submit!";
    } else if (isFatal || currentScore < 50) {
        statusItem.color = '#ff5555'; // Red
        statusItem.text = `$(alert) Grade: ${currentScore}`;
        statusItem.tooltip = "Submission BLOCKED. Click for details.";
    } else {
        statusItem.color = '#ffb86c'; // Orange
        statusItem.tooltip = "Passable, but clean it up. Click for details.";
    }
    
    statusItem.show();
}

export function deactivate() {}