# Grade Guardian

**Your Pre-Submission Audit Tool.**

You spend 5 hours coding the assignment, but you lose marks because you left `C:\Users\YourName` in the file path, or forgot a `console.log`.

**Grade Guardian** sits in your status bar and grades your code in real-time (0 to 100). If you are red, **do not submit**.

## 🔥 The "Instant Fail" Detectors
The extension actively scans for these common reasons assignments get rejected:
1.  **Absolute Paths** (e.g. `C:/Users/...`) -> Code works on your laptop, FAILS on the Prof's laptop.
2.  **Console Logs / Print Statements** -> Professional code doesn't spam the console.
3.  **Spaghetti Code** -> Too much nesting (indentation > 4 levels deep).
4.  **Empty Catch Blocks** -> Hiding errors is a crime.
5.  **Missing Name/Roll No** -> Configure your name in settings, and it alerts you if you forgot to add it to the top of the file.

## Usage
1.  Just write code.
2.  Watch the **Grade** in the bottom left status bar.
3.  If it isn't **100/100**, click the Grade to see exactly what lines are killing your score.

## Settings
Go to File > Preferences > Settings and search "GradePEX".
*   `Student Name`: Enter your name or ID here (e.g. `Jawad Ahmed`). The extension will enforce that this name exists in the file header.