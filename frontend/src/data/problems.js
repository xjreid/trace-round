export const problems = [
    {
        id: 1,
        title: "Two Sum",
        difficulty: "Easy",
        category: "Array",
        slug: "two-sum",
        desc: "Given an array of integers and a target, return the indices of two distinct values whose sum equals the target. Assume exactly one valid answer exists; the array contains 2 to 10,000 elements and values may be negative."
    },
    {
        id: 2,
        title: "Add Two Numbers",
        difficulty: "Medium",
        category: "Linked List",
        slug: "add-two-numbers",
        desc: "Add two non-negative integers represented by linked lists whose digits are stored in reverse order, then return the sum in the same format. Each list has 1 to 100 nodes, each node stores a digit from 0 to 9, and there are no leading zeroes except for zero itself."
    },
    {
        id: 3,
        title: "Longest Substring Without Repeating Characters",
        difficulty: "Medium",
        category: "String",
        slug: "longest-substring-without-repeating-characters",
        desc: "Find the length of the longest contiguous substring that contains no repeated characters. The input string may contain letters, digits, symbols, and spaces, and its length is between 0 and 50,000 characters."
    },
    {
        id: 4,
        title: "Valid Parentheses",
        difficulty: "Easy",
        category: "Stack",
        slug: "valid-parentheses",
        desc: "Determine whether a string of brackets is valid: every opening bracket must be closed by the same type in the correct order. The string contains only (), {}, and [] characters and has a length between 1 and 10,000."
    },
    {
        id: 5,
        title: "Merge Two Sorted Lists",
        difficulty: "Easy",
        category: "Linked List",
        slug: "merge-two-sorted-lists",
        desc: "Merge two ascending linked lists into one ascending list by reusing their nodes. Each input list contains 0 to 50 nodes, and every node value is between -100 and 100."
    },
    {
        id: 6,
        title: "Best Time to Buy and Sell Stock",
        difficulty: "Easy",
        category: "Array",
        slug: "best-time-to-buy-and-sell-stock",
        desc: "Given daily stock prices, find the maximum profit possible from one purchase followed by one later sale; return 0 if no profit is possible. The array contains 1 to 100,000 positive prices."
    },
    {
        id: 7,
        title: "Maximum Subarray",
        difficulty: "Medium",
        category: "Dynamic Programming",
        slug: "maximum-subarray",
        desc: "Find the contiguous non-empty subarray with the greatest sum and return that sum. The array contains 1 to 100,000 integers, with each value between -10,000 and 10,000."
    },
    {
        id: 8,
        title: "Product of Array Except Self",
        difficulty: "Medium",
        category: "Array",
        slug: "product-of-array-except-self",
        desc: "Return an array where each position contains the product of every input value except the value at that position. Do not use division and target linear time; the input has 2 to 100,000 integers and every prefix or suffix product fits in a 32-bit integer."
    },
    {
        id: 9,
        title: "Binary Tree Level Order Traversal",
        difficulty: "Medium",
        category: "Tree",
        slug: "binary-tree-level-order-traversal",
        desc: "Return the values of a binary tree level by level from left to right. The tree may be empty and contains at most 2,000 nodes, with node values between -1,000 and 1,000."
    },
    {
        id: 10,
        title: "Number of Islands",
        difficulty: "Medium",
        category: "Graph",
        slug: "number-of-islands",
        desc: "Count the connected groups of land in a rectangular grid of water and land cells, where connections are horizontal or vertical. The grid dimensions are between 1 and 300, and every cell is either 0 or 1."
    },
    {
        id: 11,
        title: "Coin Change",
        difficulty: "Medium",
        category: "Dynamic Programming",
        slug: "coin-change",
        desc: "Given coin denominations and a target amount, return the fewest coins needed to make that amount, or -1 when it is impossible. There are 1 to 12 distinct positive denominations, and the target amount is between 0 and 10,000."
    },
    {
        id: 12,
        title: "Search in Rotated Sorted Array",
        difficulty: "Medium",
        category: "Searching",
        slug: "search-in-rotated-sorted-array",
        desc: "Find a target value in a sorted array that has been rotated at an unknown pivot and return its index, or -1 if absent. All values are unique, the array has 1 to 5,000 elements, and the solution should run in logarithmic time."
    },
    {
        id: 13,
        title: "Course Schedule",
        difficulty: "Medium",
        category: "Topological Sort",
        slug: "course-schedule",
        desc: "Determine whether every course can be completed given prerequisite pairs, which may form a dependency cycle. There are 1 to 2,000 courses and at most 5,000 prerequisite relationships."
    },
    {
        id: 14,
        title: "Merge K Sorted Lists",
        difficulty: "Hard",
        category: "Heap",
        slug: "merge-k-sorted-lists",
        desc: "Merge an array of ascending linked lists into one ascending linked list. There may be up to 10,000 lists, the total number of nodes is at most 10,000, and node values range from -10,000 to 10,000."
    },
    {
        id: 15,
        title: "Trapping Rain Water",
        difficulty: "Hard",
        category: "Two Pointers",
        slug: "trapping-rain-water",
        desc: "Given non-negative bar heights of unit width, calculate how much rainwater can be trapped between the bars. The array contains 1 to 20,000 heights, and each height is between 0 and 100,000."
    },
    {
        id: 16,
        title: "N-Queens",
        difficulty: "Hard",
        category: "Backtracking",
        slug: "n-queens",
        desc: "Place n queens on an n-by-n chessboard so that no two queens attack each other, and return every distinct arrangement. The value of n is between 1 and 9."
    },
    {
        id: 17,
        title: "Sort Colors",
        difficulty: "Medium",
        category: "Sorting",
        slug: "sort-colors",
        desc: "Sort an array containing only 0, 1, and 2 in place so equal values are adjacent and ordered. The array contains 1 to 300 elements, and a library sort should not be used."
    },
    {
        id: 18,
        title: "Jump Game",
        difficulty: "Medium",
        category: "Greedy",
        slug: "jump-game",
        desc: "Determine whether the last index can be reached when each array value gives the maximum jump length from that position. The array has 1 to 10,000 non-negative values, each no greater than 100,000."
    },
    {
        id: 19,
        title: "Happy Number",
        difficulty: "Easy",
        category: "Math",
        slug: "happy-number",
        desc: "Repeatedly replace a positive integer with the sum of the squares of its digits and determine whether the sequence reaches 1. The input is a positive 32-bit integer."
    },
    {
        id: 20,
        title: "Single Number",
        difficulty: "Easy",
        category: "Bit Manipulation",
        slug: "single-number",
        desc: "Find the only value that appears once in an array where every other value appears exactly twice. The array has 1 to 30,000 integers, and the solution should use linear time and constant extra space."
    },
    {
        id: 21,
        title: "LRU Cache",
        difficulty: "Medium",
        category: "Design",
        slug: "lru-cache",
        desc: "Design a least-recently-used cache with get and put operations that both run in constant average time. The capacity is between 1 and 3,000, with at most 200,000 operations."
    },
    {
        id: 22,
        title: "Second Highest Salary",
        difficulty: "Medium",
        category: "Database",
        slug: "second-highest-salary",
        desc: "Write a database query that returns the second-highest distinct employee salary, or null when it does not exist. The employee table has unique IDs and non-negative salary values."
    },
    {
        id: 23,
        title: "Tenth Line",
        difficulty: "Easy",
        category: "Shell",
        slug: "tenth-line",
        desc: "Write a shell command that prints the tenth line of a text file when that line exists. The input is a valid text file and may contain fewer than ten lines."
    },
    {
        id: 24,
        title: "Print in Order",
        difficulty: "Easy",
        category: "Concurrency",
        slug: "print-in-order",
        desc: "Coordinate three methods invoked by different threads so they always print first, second, and third in that order. Each method is called exactly once, but thread scheduling is arbitrary."
    },
    {
        id: 25,
        title: "Design a URL Shortener",
        difficulty: "Hard",
        category: "System Design",
        slug: "design-url-shortener",
        desc: "Design a service that creates short aliases for long URLs and redirects aliases to their original destinations. Consider uniqueness, expiration, high read volume, horizontal scaling, and billions of stored URLs."
    },
    {
        id: 26,
        title: "Design a Parking Lot",
        difficulty: "Medium",
        category: "Object-Oriented Design",
        slug: "design-parking-lot",
        desc: "Model a parking lot that assigns compatible spaces, tracks tickets, and calculates fees for multiple vehicle types. The design should support multiple floors and allow new pricing or vehicle rules to be added."
    },
    {
        id: 27,
        title: "Reverse a Linked List Recursively",
        difficulty: "Easy",
        category: "Recursion",
        slug: "reverse-linked-list-recursively",
        desc: "Reverse a singly linked list using recursion and return its new head. The list contains 0 to 5,000 nodes with values between -5,000 and 5,000."
    },
    {
        id: 28,
        title: "Group Anagrams",
        difficulty: "Medium",
        category: "Hash Table",
        slug: "group-anagrams",
        desc: "Group strings that contain the same letters with the same frequencies, returning the groups in any order. There are 1 to 10,000 lowercase strings, each at most 100 characters long."
    },
    {
        id: 29,
        title: "Implement Trie",
        difficulty: "Medium",
        category: "Trie",
        slug: "implement-trie",
        desc: "Implement a prefix tree supporting word insertion, exact search, and prefix search. Inputs contain only lowercase English letters, and at most 30,000 operations are performed."
    },
    {
        id: 30,
        title: "Range Sum Query - Mutable",
        difficulty: "Medium",
        category: "Segment Tree",
        slug: "range-sum-query-mutable",
        desc: "Support point updates and inclusive range-sum queries on an integer array. The array has 1 to 30,000 elements and receives at most 30,000 update or query operations."
    },
    {
        id: 31,
        title: "Count Smaller Numbers After Self",
        difficulty: "Hard",
        category: "Binary Indexed Tree",
        slug: "count-smaller-numbers-after-self",
        desc: "For each array element, count how many smaller values appear to its right. The array has 1 to 100,000 integers, with values between -10,000 and 10,000."
    },
    {
        id: 32,
        title: "Redundant Connection",
        difficulty: "Medium",
        category: "Union Find",
        slug: "redundant-connection",
        desc: "Given an undirected graph formed by adding one edge to a tree, return the edge that creates a cycle. The graph has 3 to 1,000 nodes, and each edge connects two distinct nodes."
    },
    {
        id: 33,
        title: "Kth Largest Element in an Array",
        difficulty: "Medium",
        category: "Divide and Conquer",
        slug: "kth-largest-element-in-an-array",
        desc: "Find the kth-largest value in an unsorted array without fully sorting it. The array contains 1 to 100,000 integers, and k is a valid one-based rank."
    },
    {
        id: 34,
        title: "Minimum Size Subarray Sum",
        difficulty: "Medium",
        category: "Sliding Window",
        slug: "minimum-size-subarray-sum",
        desc: "Find the shortest contiguous subarray whose sum is at least a target, or return 0 if none exists. The array contains 1 to 100,000 positive integers and the target is positive."
    },
    {
        id: 35,
        title: "Number of Recent Calls",
        difficulty: "Easy",
        category: "Queue",
        slug: "number-of-recent-calls",
        desc: "Create a counter that reports how many requests occurred within the inclusive 3,000-millisecond window ending at each new request. Request timestamps are strictly increasing, with at most 10,000 calls."
    },
    {
        id: 36,
        title: "Design Circular Deque",
        difficulty: "Medium",
        category: "Deque",
        slug: "design-circular-deque",
        desc: "Design a fixed-capacity double-ended queue supporting insertion, deletion, and inspection at both ends. Capacity is between 1 and 1,000, with at most 2,000 operations."
    },
    {
        id: 37,
        title: "Daily Temperatures",
        difficulty: "Medium",
        category: "Monotonic Stack",
        slug: "daily-temperatures",
        desc: "For each daily temperature, return how many days must pass before a warmer temperature occurs, or 0 if none does. There are 1 to 100,000 temperatures between 30 and 100."
    },
    {
        id: 38,
        title: "Shortest Subarray with Sum at Least K",
        difficulty: "Hard",
        category: "Monotonic Queue",
        slug: "shortest-subarray-with-sum-at-least-k",
        desc: "Find the length of the shortest non-empty subarray with a sum of at least k, or return -1. The array has 1 to 100,000 signed integers, so negative values must be handled."
    },
    {
        id: 39,
        title: "Count Square Sum Triples",
        difficulty: "Easy",
        category: "Brute Force",
        slug: "count-square-sum-triples",
        desc: "Count ordered triples of positive integers a, b, and c no greater than n where a squared plus b squared equals c squared. The value of n is between 1 and 250."
    },
    {
        id: 40,
        title: "Word Break",
        difficulty: "Medium",
        category: "Memoization",
        slug: "word-break",
        desc: "Determine whether a string can be split into a sequence of one or more dictionary words, with words reusable. The string has 1 to 300 lowercase characters and the dictionary contains up to 1,000 words."
    },
    {
        id: 41,
        title: "Unique Paths",
        difficulty: "Medium",
        category: "Tabulation",
        slug: "unique-paths",
        desc: "Count the paths from the top-left to the bottom-right of a grid when movement is limited to right or down. Each grid dimension is between 1 and 100, and the answer fits in a 32-bit integer."
    },
    {
        id: 42,
        title: "Nim Game",
        difficulty: "Easy",
        category: "Game Theory",
        slug: "nim-game",
        desc: "Determine whether the first player can force a win when two players alternately remove one to three stones from a pile. The pile contains between 1 and 2,147,483,647 stones."
    },
    {
        id: 43,
        title: "Random Pick with Weight",
        difficulty: "Medium",
        category: "Randomized",
        slug: "random-pick-with-weight",
        desc: "Randomly return an index with probability proportional to its positive integer weight. There are 1 to 10,000 weights, their total fits in a 32-bit integer, and up to 10,000 picks are requested."
    },
    {
        id: 44,
        title: "Subsets",
        difficulty: "Medium",
        category: "Bitmasking",
        slug: "subsets",
        desc: "Return the power set of an array of unique integers, without duplicate subsets. The array contains at most 10 values, so the result contains exactly 2 raised to the array length subsets."
    },
    {
        id: 45,
        title: "Pascal's Triangle",
        difficulty: "Easy",
        category: "Combinatorics",
        slug: "pascals-triangle",
        desc: "Generate the first requested rows of Pascal's triangle, where each interior value is the sum of the two values above it. The requested row count is between 1 and 30."
    },
    {
        id: 46,
        title: "Soup Servings",
        difficulty: "Medium",
        category: "Probability",
        slug: "soup-servings",
        desc: "Calculate the probability that soup A becomes empty before soup B, plus half the probability that both empty together, under four equally likely serving choices. The starting amount is between 0 and 1,000,000 milliliters."
    },
    {
        id: 47,
        title: "Max Points on a Line",
        difficulty: "Hard",
        category: "Geometry",
        slug: "max-points-on-a-line",
        desc: "Find the maximum number of distinct points that lie on the same straight line. There are 1 to 300 points, and each coordinate is between -10,000 and 10,000."
    },
    {
        id: 48,
        title: "Network Delay Time",
        difficulty: "Medium",
        category: "Graph Theory",
        slug: "network-delay-time",
        desc: "Find how long a signal takes to reach every node in a directed weighted network, or return -1 if any node is unreachable. The graph has 1 to 100 nodes and up to 6,000 positive-weight edges."
    },
    {
        id: 49,
        title: "Count Primes",
        difficulty: "Medium",
        category: "Number Theory",
        slug: "count-primes",
        desc: "Count the prime numbers strictly less than a non-negative integer n. The value of n is between 0 and 5,000,000."
    },
    {
        id: 50,
        title: "Find the First Occurrence in a String",
        difficulty: "Easy",
        category: "String Matching",
        slug: "find-first-occurrence-in-a-string",
        desc: "Return the starting index of the first occurrence of a pattern within a text, or -1 when absent. Both strings contain lowercase English letters and have lengths between 1 and 10,000."
    },
    {
        id: 51,
        title: "Find Median from Data Stream",
        difficulty: "Hard",
        category: "Data Stream",
        slug: "find-median-from-data-stream",
        desc: "Design a structure that accepts integers one at a time and returns the median of all values seen so far. Values range from -100,000 to 100,000, with at most 50,000 total operations."
    }
]
