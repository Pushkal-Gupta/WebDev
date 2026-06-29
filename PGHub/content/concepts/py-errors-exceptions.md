---
slug: py-errors-exceptions
module: python-language
title: Errors & Exceptions
subtitle: How Python signals that something went wrong, how try/except/else/finally let you respond, and how an unhandled error travels up the call stack.
difficulty: Intermediate
position: 7
estimatedReadMinutes: 13
prereqs: [py-functions-scope]
relatedProblems: []
references:
  - title: "The Python Tutorial — Errors and Exceptions"
    url: "https://docs.python.org/3/tutorial/errors.html"
    type: docs
  - title: "Python docs — Built-in Exceptions (hierarchy)"
    url: "https://docs.python.org/3/library/exceptions.html"
    type: docs
  - title: "Real Python — Python Exceptions: An Introduction"
    url: "https://realpython.com/python-exceptions/"
    type: article
  - title: "Real Python — Python's raise: Effectively Raising Exceptions in Your Code"
    url: "https://realpython.com/python-raise-exception/"
    type: article
status: published
---

## intro
When something goes wrong at runtime — dividing by zero, indexing past the end of a list, parsing `"abc"` as an integer — Python doesn't return a magic error value. It **raises an exception**: a special object that interrupts normal flow and starts climbing the call stack, looking for code prepared to deal with it. If a handler catches it, the program recovers; if none does, the interpreter prints a traceback and stops. Exceptions are the language's built-in mechanism for separating the normal path from the failure path, and `try` / `except` / `else` / `finally` are the four blocks you use to respond.

## whyItMatters
Every real program touches things that can fail: files that don't exist, network calls that time out, user input that's malformed, keys that aren't in a dict. How you handle those failures decides whether your code is robust or brittle. Ignore them and a single bad row crashes a batch job halfway through; catch them carelessly and a real bug gets silently swallowed, surfacing later as corrupt data nobody can trace. Exceptions also encode *intent*: raising `ValueError` for bad input tells the caller exactly what went wrong, and a custom exception type lets a whole codebase agree on how a domain failure looks. Interviewers probe this because clean error handling is the mark of production-ready code, not toy scripts.

## intuition
Think of an exception as an **alarm that gets passed up a chain of command**. Code deep inside your program hits a wall it can't handle, so instead of guessing, it raises the alarm and immediately stops what it was doing. That alarm travels **up the call stack** — the chain of function calls that led here. At each level Python asks: "does this frame have a `try` block whose `except` is ready for *this kind* of alarm?" The first frame that says yes catches it and execution resumes there. If the alarm reaches the very top — the place that started everything — with nobody having caught it, the program crashes and prints a traceback showing the whole chain.

This bubbling-up behaviour is what makes exceptions powerful: the code that *detects* a problem doesn't have to be the code that *decides what to do about it*. A low-level parser can raise `ValueError` without knowing whether the caller wants to retry, log, or give up — that choice lives wherever the matching `except` sits.

It also frames a classic style choice. **LBYL** ("look before you leap") checks every precondition first: `if key in d and d[key] is not None and ...`. **EAFP** ("easier to ask forgiveness than permission") just tries the operation and catches the failure: `try: return d[key] except KeyError: ...`. Python leans hard toward EAFP — it's usually cleaner, avoids race conditions between the check and the use, and skips the cost of redundant tests on the common success path. You attempt the thing, and you handle the specific exception that the thing raises when it can't be done. The art is catching the *right* exception, at the *right* level, and letting everything you can't sensibly handle keep bubbling up to someone who can.

## visualization
```
TRY / EXCEPT / ELSE / FINALLY — the four blocks and when each one runs
    try:        attempt the risky code ............ always entered
    except E:   runs ONLY if an E was raised ...... handles that error
    else:       runs ONLY if try raised nothing ... the success path
    finally:    runs ALWAYS — error or not ........ cleanup / release

PROPAGATION — a raise climbs UP the call stack until a frame catches it
    main()            top of stack; if it reaches here uncaught -> traceback
      checkout()      has  except WithdrawalError  ->  MATCHES, catches, stops
        process()     no handler  ->  exception passes straight through
          withdraw()  raise WithdrawalError   (deepest frame: the origin)
    travel order: withdraw -> process -> checkout(caught). Frames pop as it goes.
```

## bruteForce
Without exceptions you fall back to **error codes and defensive pre-checks**. Every function returns a sentinel — `-1`, `None`, a `(ok, value)` pair — and every caller must remember to test it before using the result. Miss one check and a bad value silently flows downstream. The other half is **LBYL overkill**: guarding each operation with `if os.path.exists(p) and os.access(p, ...)` before opening a file, re-validating the same conditions at every layer. This bloats the happy path with checking noise, duplicates validation logic, and still races — the file can vanish between your `exists` check and your `open`. Error handling ends up tangled into normal logic everywhere.

## optimal
Use the four blocks for their distinct jobs. **`try`** wraps only the lines that can actually fail — keep it small so you know exactly what you're catching. **`except SpecificError`** handles one failure mode; list several `except` clauses (or a tuple, `except (KeyError, IndexError)`) for distinct cases. **`else`** holds the code that should run *only when the `try` succeeded* — it keeps the success path out of the `try`, so an exception raised there isn't accidentally caught by your handler. **`finally`** runs no matter what — return, raise, or normal exit — and is where you release resources (close files, sockets, locks); a `with` block is the cleaner form for that.

**Catch by type, and catch narrowly.** `except ValueError` says precisely what you expected to go wrong; a bare `except:` or `except Exception:` swallows *everything*, hiding real bugs and even masking `Ctrl-C`. Catch only what you can sensibly handle and let the rest propagate. **Raise to signal** with `raise ValueError("port must be positive")`; inside an `except`, a bare `raise` **re-raises** the current exception unchanged after you've logged or partially handled it. **Chain** with `raise NewError(...) from original` to translate a low-level error into a domain one while preserving the cause on `__cause__`.

For domain failures, define a **custom exception** by subclassing `Exception` (never `BaseException` directly): `class WithdrawalError(Exception): ...`. It slots into the **hierarchy** — `BaseException` at the root, then `Exception` (the base for everything you'd normally catch), then concrete types like `ValueError`, `KeyError`, `TypeError`, `OSError`. Because `except` matches subclasses, catching `Exception` catches your custom error too, and catching a base like `ArithmeticError` catches `ZeroDivisionError`. Subclasses left of `Exception` — `SystemExit`, `KeyboardInterrupt`, `GeneratorExit` — sit under `BaseException` on purpose, so a normal `except Exception` doesn't trap them.

## complexity
time: Setting up a `try` block is essentially free — on CPython, entering a `try` adds no measurable cost when no exception is raised, so the common success path pays nothing. Raising and catching an exception *is* relatively expensive (building the exception object, unwinding frames), so exceptions suit the exceptional case, not tight inner-loop control flow.
space: An exception object plus a traceback referencing each unwound frame — O(depth of the call stack). Chained exceptions hold their `__cause__`/`__context__`, adding the linked chain.
notes: "Zero cost when not raised" is why EAFP is idiomatic in Python: wrapping an operation in `try` costs nothing on success, whereas an explicit pre-check runs on every call. Reserve raising for genuinely abnormal conditions.

## pitfalls
- **Bare `except:` swallows everything.** `except:` (or `except BaseException:`) also catches `KeyboardInterrupt` and `SystemExit`, so `Ctrl-C` and `sys.exit()` stop working, and every real bug is hidden as if handled. Always name the type: `except ValueError:`. If you truly need a catch-all, use `except Exception:` (which spares the system signals) and re-raise or log with the traceback.
- **Catching `Exception` too broadly.** A handler around a 50-line block that catches `Exception` will quietly absorb a `TypeError` from an unrelated bug as if it were the expected failure. Shrink the `try` to the risky line and catch the narrowest type that fits, so unexpected errors still surface.
- **Using exceptions for ordinary control flow.** Raising/catching to break out of nested loops or to signal "not found" on the hot path is slower and obscures intent. Exceptions are for the abnormal; use return values, `dict.get(k, default)`, or a sentinel for expected outcomes (the exception is fine when "not found" is genuinely exceptional).
- **`finally` masking the real exception.** A `return` (or `raise`) inside `finally` overrides whatever the `try` raised — the original exception is silently discarded and the caller sees the `finally` result instead. Never `return`/`raise` from `finally`; keep it to cleanup only.
- **Catching but doing nothing useful.** `except Exception: pass` discards the error with no log, no re-raise, no recovery — the program limps on in a broken state with no trace of what failed. If you catch, either handle meaningfully, log with the traceback, or re-raise.

## interviewTips
- State the four-block roles crisply: "`try` attempts, `except` handles a specific type, `else` is the success-only path, `finally` always runs for cleanup." Then add *why* `else` exists — to keep the success code out of the `try` so its own errors aren't swallowed.
- Explain propagation: an uncaught exception unwinds frame by frame up the call stack until a matching `except` is found, or it reaches the top and prints a traceback. Mention that `except` matches subclasses, so catching `Exception` catches custom subclasses too.
- Contrast EAFP vs LBYL and say Python prefers EAFP: try the operation and catch the specific failure, rather than pre-checking — it's cleaner, avoids check-then-use races, and costs nothing on the success path.

## keyTakeaways
- `try` runs risky code; `except Type` handles a specific failure; `else` runs only on success; `finally` always runs for cleanup. Catch by type, never with a bare `except:`.
- A raised exception travels up the call stack until a frame's `except` matches its type (subclasses count); if none does, it reaches the top and the program prints a traceback and exits.
- Subclass `Exception` for domain errors, `raise` to signal and bare `raise` to re-raise, and `raise X from cause` to chain; Python favours EAFP because a `try` is free when nothing is raised.

## code.python
```python
# Errors & Exceptions: try/except/else/finally, raise, a custom exception
# subclass, chaining (raise ... from ...), and propagation up the call stack.

# --- A custom exception subclass carrying domain-specific data ----------
class WithdrawalError(Exception):
    def __init__(self, amount, balance):
        self.amount = amount
        self.balance = balance
        super().__init__(f"cannot withdraw {amount}: balance is {balance}")


class ConfigError(Exception):
    pass


# try / except(SPECIFIC) / else / finally, all in one function.
def safe_divide(a, b):
    try:
        result = a / b
    except ZeroDivisionError:                 # catch one specific type
        print("  except : division by zero")
        return None
    else:                                     # runs ONLY if try succeeded
        print(f"  else   : ok -> {result}")
        return result
    finally:                                  # ALWAYS runs, even on return
        print("  finally: cleanup")


def withdraw(balance, amount):
    if amount > balance:
        raise WithdrawalError(amount, balance)   # signal the error upward
    return balance - amount


def process_payment(balance, amount):
    # No try here: the exception passes THROUGH this frame untouched.
    return withdraw(balance, amount)


def checkout(balance, amount):
    try:
        return process_payment(balance, amount)
    except WithdrawalError as err:               # caught two frames up
        print(f"  caught : {err}")
        print(f"  detail : shortfall = {err.amount - err.balance}")
        return balance


def load_port(raw):
    try:
        return int(raw)
    except ValueError as err:
        raise ConfigError(f"bad port {raw!r}") from err   # chain the cause


# --- Run it all; every raise is caught, so nothing escapes --------------
print("divide 10 / 2:")
print("  result:", safe_divide(10, 2))
print("divide 10 / 0:")
print("  result:", safe_divide(10, 0))

print("checkout(100, 30):", checkout(100, 30))
print("checkout(50, 80):")
print("  result:", checkout(50, 80))

try:
    load_port("8080x")
except ConfigError as err:
    print("config :", err)
    print("cause  :", type(err.__cause__).__name__)

# Expected stdout:
# divide 10 / 2:
#   else   : ok -> 5.0
#   finally: cleanup
#   result: 5.0
# divide 10 / 0:
#   except : division by zero
#   finally: cleanup
#   result: None
# checkout(100, 30): 70
# checkout(50, 80):
#   caught : cannot withdraw 80: balance is 50
#   detail : shortfall = 30
#   result: 50
# config : bad port '8080x'
# cause  : ValueError
```

## code.javascript
```javascript
// try / catch / finally, throw, a custom Error subclass, propagation.
class WithdrawalError extends Error {
  constructor(amount, balance) {
    super(`cannot withdraw ${amount}: balance is ${balance}`);
    this.name = "WithdrawalError";
    this.amount = amount;
    this.balance = balance;
  }
}

function safeDivide(a, b) {
  try {
    if (b === 0) throw new RangeError("division by zero"); // JS would give Infinity
    const result = a / b;
    console.log(`  ok -> ${result}`);
    return result;
  } catch (err) {
    console.log(`  caught: ${err.message}`);
    return null;
  } finally {
    console.log("  finally: cleanup");
  }
}

function withdraw(balance, amount) {
  if (amount > balance) throw new WithdrawalError(amount, balance);
  return balance - amount;
}

function checkout(balance, amount) {
  try {
    return withdraw(balance, amount);     // may propagate through here
  } catch (err) {
    if (err instanceof WithdrawalError) { // catch by type
      console.log(`  caught: ${err.message}`);
      return balance;
    }
    throw err;                            // re-raise anything we don't handle
  }
}

console.log("divide 10 / 2:", safeDivide(10, 2));
console.log("divide 10 / 0:", safeDivide(10, 0));
console.log("checkout(100, 30):", checkout(100, 30));
console.log("checkout(50, 80):", checkout(50, 80));
// divide 10 / 2: -> ok -> 5 / finally / 5
// divide 10 / 0: -> caught / finally / null
// checkout(100, 30): 70
// checkout(50, 80): caught ... -> 50
```

## code.java
```java
public class Errors {
    // A checked custom exception, subclassing Exception.
    static class WithdrawalException extends Exception {
        final int amount, balance;
        WithdrawalException(int amount, int balance) {
            super("cannot withdraw " + amount + ": balance is " + balance);
            this.amount = amount;
            this.balance = balance;
        }
    }

    static Integer safeDivide(int a, int b) {
        try {
            int result = a / b;            // throws ArithmeticException if b == 0
            System.out.println("  ok -> " + result);
            return result;
        } catch (ArithmeticException e) {  // catch one specific type
            System.out.println("  caught: " + e.getMessage());
            return null;
        } finally {
            System.out.println("  finally: cleanup");
        }
    }

    static int withdraw(int balance, int amount) throws WithdrawalException {
        if (amount > balance) throw new WithdrawalException(amount, balance);
        return balance - amount;
    }

    static int checkout(int balance, int amount) {
        try {
            return withdraw(balance, amount);   // may propagate
        } catch (WithdrawalException e) {       // caught by type
            System.out.println("  caught: " + e.getMessage()
                + " (shortfall " + (e.amount - e.balance) + ")");
            return balance;
        }
    }

    public static void main(String[] args) {
        System.out.println("divide 10 / 2: " + safeDivide(10, 2));
        System.out.println("divide 10 / 0: " + safeDivide(10, 0));
        System.out.println("checkout(100, 30): " + checkout(100, 30));
        System.out.println("checkout(50, 80): " + checkout(50, 80));
    }
}
```

## code.cpp
```cpp
#include <iostream>
#include <stdexcept>
#include <string>
using namespace std;

// Custom exception type, subclassing std::runtime_error.
struct WithdrawalError : public runtime_error {
    int amount, balance;
    WithdrawalError(int a, int b)
        : runtime_error("cannot withdraw " + to_string(a) +
                        ": balance is " + to_string(b)),
          amount(a), balance(b) {}
};

int withdraw(int balance, int amount) {
    if (amount > balance) throw WithdrawalError(amount, balance);  // signal up
    return balance - amount;
}

int checkout(int balance, int amount) {
    try {
        return withdraw(balance, amount);        // may propagate through here
    } catch (const WithdrawalError& e) {         // catch by reference, by type
        cout << "  caught: " << e.what()
             << " (shortfall " << e.amount - e.balance << ")\n";
        return balance;
    }
}

int main() {
    // Catch a standard-library exception by its specific type.
    try {
        int n = stoi("abc");                     // throws std::invalid_argument
        cout << n << "\n";
    } catch (const invalid_argument& e) {
        cout << "  caught: invalid_argument\n";
    }

    cout << "checkout(100, 30): " << checkout(100, 30) << "\n";
    cout << "checkout(50, 80): " << checkout(50, 80) << "\n";
    return 0;
}
```
