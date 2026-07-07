---
slug: arch-numbers-representation
module: computer-architecture
title: How Computers Store Numbers
subtitle: The bit-level truth behind integers and reals — two's complement and why it makes subtraction free, IEEE-754 floating point and why 0.1 + 0.2 is not 0.3, integer overflow and its silent wraparound, and endianness, the byte-order convention that bites anyone moving data between machines.
difficulty: Intermediate
position: 4
estimatedReadMinutes: 14
prereqs: []
relatedProblems: []
references:
  - title: "Bryant & O'Hallaron — Computer Systems: A Programmer's Perspective, Ch. 2: Representing and Manipulating Information"
    url: "http://csapp.cs.cmu.edu/"
    type: book
  - title: "David Goldberg — What Every Computer Scientist Should Know About Floating-Point Arithmetic"
    url: "https://docs.oracle.com/cd/E19957-01/806-3568/ncg_goldberg.html"
    type: article
  - title: "IEEE 754-2019 — Standard for Floating-Point Arithmetic (overview)"
    url: "https://en.wikipedia.org/wiki/IEEE_754"
    type: article
  - title: "Patterson & Hennessy — Computer Organization and Design, Ch. 3: Arithmetic for Computers"
    url: "https://www.elsevier.com/books/computer-organization-and-design-risc-v-edition/patterson/978-0-12-820331-6"
    type: book
status: published
---

## intro
A computer has no idea what a number is. All it has are bits — switches that are on or off — and a set of conventions for interpreting patterns of those switches as values. Change the convention and the same 32 bits mean a positive integer, a negative integer, or a fractional real. Almost every "weird" bug a programmer eventually hits — a positive number that turns negative when it grows too large, a currency total that comes out a hundredth of a cent off, a file that reads as garbage on another machine — is not a mystery. It is the number representation doing exactly what it was defined to do. This lesson makes those conventions explicit so the surprises stop being surprises.

## whyItMatters
The gap between the numbers you write in source and the bits the hardware stores causes real, expensive failures. Overflow wraparound has crashed rockets and corrupted databases; naive floating-point comparison has broken financial reconciliations and physics simulations; byte-order mismatches have silently corrupted network protocols and file formats for decades. Beyond the disasters, this knowledge is everyday craft: it tells you when `int` will silently truncate, why you compare floats with a tolerance instead of `==`, why hashing and bit-twiddling tricks work, and why money belongs in integer cents or a decimal type rather than a `double`. It is also a staple of systems interviews, where "how are negative numbers stored?" and "why is 0.1 + 0.2 not 0.3?" separate people who memorized answers from people who understand the machine.

## intuition
Start with unsigned integers, which are the easy case: bits are just base-2 digits, so `0000` is 0 and `1111` is 15, exactly like decimal but with two symbols instead of ten. The interesting question is how to store negative numbers when all you have is bits. The naive idea — steal the top bit as a sign flag — turns out to be clumsy: it gives you two zeros (positive and negative zero) and forces the adder to special-case signs. Hardware designers found something far more elegant, and it is the convention every modern machine uses: **two's complement**.

The trick behind two's complement is to make the top bit carry *negative* weight. In an 8-bit number the bits are worth 128, 64, 32, 16, 8, 4, 2, 1 — but in two's complement the leftmost bit is worth **minus** 128. So `1000 0000` is -128, `1111 1111` is -1 (since -128 + 64 + 32 + ... + 1 = -1), and `0111 1111` is +127. The beauty is that ordinary binary addition now "just works" across the sign boundary: add the bit patterns for -1 and +1 and you get all zeros (with the carry falling off the end), which is exactly 0. Subtraction becomes "negate and add," and negation is itself simple — flip every bit and add one. One adder handles signed and unsigned arithmetic identically; there is a single zero; and the representable range is asymmetric by one (from -128 to +127 for 8 bits) because zero eats one of the "positive" slots. That asymmetry is why `-INT_MIN` overflows: there is no positive counterpart to the most negative value.

Reals are a harder problem, because there are infinitely many of them between any two points and only finitely many bit patterns. **IEEE-754 floating point** solves this the way scientific notation does: store a **sign**, an **exponent**, and a **mantissa** (the significant digits), so `6.022e23` becomes roughly (sign)(1.mantissa) × 2^(exponent). A 32-bit float spends 1 bit on sign, 8 on a biased exponent, and 23 on the mantissa. This buys enormous range but only about 7 decimal digits of precision, and — this is the crux — the values are spaced unevenly, dense near zero and sparse far from it. Most decimal fractions, including 0.1 and 0.2, are *repeating* fractions in binary, so they cannot be stored exactly; the hardware rounds to the nearest representable value. Add two such rounded values and the tiny errors accumulate, which is precisely why `0.1 + 0.2` lands at `0.30000000000000004` rather than clean `0.3`, and why the float visualization below shows the mantissa bits that carry that error.

## visualization
```
 Two's complement (8-bit): top bit carries NEGATIVE weight (-128)
   bits:   1  0  0  0  0  0  0  1
   weight -128 64 32 16  8  4  2  1
   value = -128 + 1                    =  -127
   negate x: flip all bits, add 1  ->  -x   (one adder does signed math)

 IEEE-754 single precision (32 bits):
   [ S | EEEEEEEE | MMMMMMMMMMMMMMMMMMMMMMM ]
     1      8                23
   value = (-1)^S x 1.MMMM(binary) x 2^(E - 127 bias)

   0.1 in binary = 0.0001100110011001100...  (repeats forever)
   -> rounded to 23 mantissa bits, so 0.1 is stored SLIGHTLY off
   0.1 + 0.2  ->  0.30000000000000004   (the rounding error, surfaced)

 Endianness (store 0x12345678 at address A):
   little-endian:  A:78  A+1:56  A+2:34  A+3:12   (low byte first)
   big-endian:     A:12  A+1:34  A+2:56  A+3:78   (high byte first)
```

## bruteForce
Before two's complement won, machines tried simpler-looking signed schemes, and their flaws explain why the winner won. **Sign-magnitude** uses the top bit purely as a sign flag and the rest as the magnitude — intuitive to read, but it produces *two* zeros (`+0` and `-0`), and the adder must inspect the signs and decide whether to add or subtract, with separate carry handling. **One's complement** represents a negative by flipping every bit of the positive; it also suffers two zeros and needs an "end-around carry" fix-up after addition. Both work, but both make the arithmetic unit more complex and litter the value space with a redundant zero and awkward edge cases. For reals, the naive alternative is **fixed point** — reserve a fixed number of bits for the fraction — which is exact for the values it can hold but wastes bits and cannot span the huge dynamic range (subatomic to astronomical) that scientific computing demands.

## optimal
**Two's complement** is the settled answer for integers because it collapses signed and unsigned arithmetic into one operation. Addition, subtraction, and multiplication use the identical bit-level adder regardless of sign; there is exactly one zero; and negation is "invert and increment." The cost is a single quirk to remember: the range is asymmetric (an N-bit value spans -2^(N-1) to 2^(N-1) - 1), so the most negative number has no positive twin and negating it overflows. **Overflow** itself is the direct consequence of fixed width: when a result exceeds the representable range the extra high bit is simply dropped, and the value **wraps around** — add 1 to the maximum `int` and you land at the minimum. For unsigned types this wraparound is defined modular arithmetic; for signed types in C and C++ it is *undefined behavior*, which is worse, because the compiler may assume it never happens and optimize accordingly.

For reals, **IEEE-754** is the universal standard, and its design repays study. The exponent is stored **biased** (add 127 for single precision) so that comparing two floats reduces to comparing their bit patterns as if they were integers — a hardware convenience. The mantissa has an **implicit leading 1** for normalized numbers, squeezing one extra bit of precision for free. The standard reserves exponent patterns for special values: **±infinity** (overflow results), **NaN** (0/0, sqrt of a negative — and notably `NaN != NaN`, so a NaN comparison is how you detect one), and **subnormals** (tiny numbers below the normal range, which trade precision for graceful underflow toward zero). The precision limit — ~7 significant decimal digits for float, ~15-16 for double — plus the uneven spacing of representable values is why you must **never** test floats with `==`: compare `fabs(a - b) < epsilon` against a tolerance scaled to the magnitudes involved. And it is why money should live in integer cents or a decimal type: binary floating point literally cannot represent `0.10` exactly, so summing cents as doubles accrues error. Finally, **endianness** governs how a multi-byte value is laid out in memory: **little-endian** machines (x86, most ARM) store the least-significant byte first, **big-endian** machines and network protocols store the most-significant byte first. Within one machine it is invisible; the moment bytes cross a boundary — a socket, a binary file, a memory-mapped device — both sides must agree, which is why network code calls `htonl`/`ntohl` to convert to and from the standardized big-endian "network byte order."

## complexity
time: Integer add, subtract, and compare are single-cycle regardless of sign because two's complement unifies them under one adder; multiply and divide are a few cycles. Floating-point add and multiply are pipelined at a few cycles of latency; division and square root are much slower. None of this depends on the numeric value, only on the operation.
space: Widths are fixed and chosen up front: typically 8/16/32/64-bit integers, 32-bit (single) and 64-bit (double) floats. The fixed width is exactly what makes overflow and limited float precision unavoidable — more bits push the limits out but never remove them.
notes: The representable integer range is asymmetric under two's complement (-2^(N-1) .. 2^(N-1)-1). Float precision is ~7 decimal digits for single, ~15-16 for double, with values spaced non-uniformly — dense near zero, sparse far away — so absolute error grows with magnitude.

## pitfalls
- **Comparing floats with `==`.** Because 0.1, 0.2, and countless other decimals are not exactly representable, `0.1 + 0.2 == 0.3` is false and equality tests fail unpredictably. Fix: compare with a tolerance — `fabs(a - b) < epsilon` — choosing epsilon relative to the magnitudes, and never gate control flow on exact float equality.
- **Ignoring integer overflow.** Adding past the maximum wraps silently to the minimum; in signed C/C++ it is undefined behavior the optimizer may exploit. Fix: use wider types, check before operating (`a > INT_MAX - b`), or use built-in overflow-checked intrinsics; treat `-INT_MIN` and `abs(INT_MIN)` as landmines.
- **Using floating point for money.** Binary floats cannot represent `0.10` exactly, so summing currency as `double` accumulates rounding error that eventually shows as off-by-a-penny totals. Fix: store money as integer cents (or the smallest unit) or use a decimal/fixed-point type designed for exact base-10 fractions.
- **Assuming a byte layout across machines.** Writing a raw multi-byte integer to a socket or binary file and reading it on a machine of different endianness yields a scrambled value. Fix: serialize to a defined byte order (network byte order via `htonl`/`ntohl`, or an explicit little/big-endian codec) rather than dumping raw memory.
- **Forgetting NaN breaks ordering.** `NaN` compares false to everything including itself, so `x == x` being false is the canonical NaN check, and sorting data containing NaNs can loop or misplace elements. Fix: detect NaN explicitly (`isnan(x)`), and scrub or handle NaNs before comparisons and sorts.

## interviewTips
- Explain two's complement by the negative-weight top bit: the leading bit is worth -2^(N-1), which is *why* one adder does signed and unsigned math, *why* there is a single zero, and *why* the range is asymmetric so `-INT_MIN` overflows. That mechanism-level answer beats reciting "flip and add one."
- Nail the 0.1 + 0.2 question: 0.1 and 0.2 are infinite repeating fractions in binary, get rounded to fit the 23-bit mantissa, and the rounded errors sum to 0.30000000000000004. Conclude with the practical rule — compare floats by tolerance, and use integers or decimal for money.
- Be ready for endianness: define little- versus big-endian, note x86 is little-endian while network byte order is big-endian, and mention `htonl`/`ntohl` as the conversion. Add that it only matters when bytes cross a machine boundary, which shows you know when it does and does not apply.

## keyTakeaways
- **Two's complement** gives the top bit negative weight, so one adder handles signed and unsigned arithmetic, there is a single zero, and the range is asymmetric (-2^(N-1) .. 2^(N-1)-1) — which is why the most negative integer has no positive counterpart and overflow silently wraps.
- **IEEE-754** floats store sign, biased exponent, and mantissa; most decimals (0.1, 0.2) are not exactly representable, so results round and `0.1 + 0.2 != 0.3` — compare with a tolerance, reserve exponent patterns encode ±inf/NaN/subnormals, and money belongs in integers or decimal.
- **Endianness** is the byte-order convention (little-endian on x86, big-endian for network order); it is invisible within one machine but must be agreed upon whenever bytes cross a socket, file, or device boundary.

## code.c
```c
#include <stdio.h>
#include <math.h>
#include <limits.h>
#include <stdint.h>

void number_gotchas(void) {
    // Two's complement wraparound: max + 1 lands at the minimum.
    int max = INT_MAX;              // 2147483647
    printf("%d\n", max + 1);        // -2147483648 (UB in signed C: don't rely on it)

    // The asymmetry: INT_MIN has no positive twin, so negating it overflows.
    printf("%d\n", -INT_MIN == INT_MIN);  // prints 1: -INT_MIN wraps to itself

    // Floating point is NOT exact: 0.1 + 0.2 != 0.3.
    double s = 0.1 + 0.2;
    printf("%.17f\n", s);           // 0.30000000000000004
    printf("%d\n", s == 0.3);       // 0 (false) -- never compare floats with ==
    printf("%d\n", fabs(s - 0.3) < 1e-9);  // 1 (true) -- compare with a tolerance

    // Endianness: peek at the bytes of a 32-bit value in memory order.
    uint32_t v = 0x12345678;
    unsigned char *b = (unsigned char *)&v;
    printf("%02x %02x %02x %02x\n", b[0], b[1], b[2], b[3]);
    // little-endian x86 prints: 78 56 34 12  (low byte stored first)
}
```

## code.asm
```asm
# x86-64: two's complement makes negation and subtraction trivial.
# neg = invert all bits then add 1; sub is just add-of-the-negation.
    mov   eax, 5
    neg   eax            # eax = -5  (0xFFFFFFFB): bit-flip + 1, one instruction
    add   eax, 5         # eax = 0   : signed add wraps cleanly across zero

# Overflow is observable: the CPU sets the Overflow flag (OF) on signed
# overflow and the Carry flag (CF) on unsigned overflow -- same ADD, two flags.
    mov   eax, 0x7FFFFFFF ; INT_MAX
    add   eax, 1          ; result 0x80000000 = INT_MIN; OF set (signed overflow)

# bswap flips byte order in place -- the primitive behind htonl/ntohl
# when converting between little-endian host and big-endian network order.
    mov   eax, 0x12345678
    bswap eax            # eax = 0x78563412
```
