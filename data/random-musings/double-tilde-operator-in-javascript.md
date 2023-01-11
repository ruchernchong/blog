---
title: Double tilde operator in JavaScript
date: "2023-01-10"
---

# Double tilde operator in JavaScript

There are 2 main ways to convert a string to a number.

## Using Number()

The `Number()` way in JavaScript gets the job done fairly quickly. And if the string cannot be a valid number, it will return `NaN`.

```js
Number("123.456"); // 123.456
```

## Using parseInt()

Another method is using `parseInt()`. This returns the nearest rounded down integer.

```js
parseInt("123.456"); // 123
```

---

The following method is the one that I recently came across. It was a rather interesting way to convert a string to a number.

## Using Double tilde (~~)

```js
~~"123.456"; // 123
```

This particular method ignores the decimal place and no rounding happens; just slightly different from the `parseInt()` method.