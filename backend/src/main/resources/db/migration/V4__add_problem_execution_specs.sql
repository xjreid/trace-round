alter table problems
    add column enabled boolean not null default false,
    add column execution_spec text;

create table problem_test_cases (
    id uuid primary key,
    problem_slug varchar(160) not null references problems(slug) on delete cascade,
    test_order integer not null,
    inputs_json text not null,
    expected_json text not null,
    unique (problem_slug, test_order)
);

create index idx_problem_test_cases_problem_order
    on problem_test_cases(problem_slug, test_order);

update problems
set enabled = true
where slug in (
    'two-sum',
    'add-two-numbers',
    'longest-substring-without-repeating-characters',
    'valid-parentheses',
    'merge-two-sorted-lists',
    'best-time-to-buy-and-sell-stock',
    'maximum-subarray',
    'product-of-array-except-self',
    'binary-tree-level-order-traversal',
    'number-of-islands',
    'coin-change',
    'search-in-rotated-sorted-array',
    'course-schedule',
    'trapping-rain-water',
    'sort-colors',
    'jump-game',
    'happy-number',
    'single-number',
    'reverse-linked-list-recursively',
    'group-anagrams',
    'redundant-connection',
    'kth-largest-element-in-an-array',
    'minimum-size-subarray-sum',
    'daily-temperatures',
    'count-square-sum-triples',
    'word-break',
    'unique-paths',
    'nim-game',
    'subsets',
    'pascals-triangle',
    'max-points-on-a-line',
    'network-delay-time',
    'count-primes',
    'find-first-occurrence-in-a-string'
);

update problems set execution_spec =
    '{"method":"twoSum","parameters":[{"name":"nums","type":"INTEGER_ARRAY"},{"name":"target","type":"INTEGER"}],"returnType":"INTEGER_ARRAY","comparison":"UNORDERED_TOP"}'
where slug = 'two-sum';
update problems set execution_spec =
    '{"method":"addTwoNumbers","parameters":[{"name":"l1","type":"LIST_NODE"},{"name":"l2","type":"LIST_NODE"}],"returnType":"LIST_NODE","comparison":"EXACT"}'
where slug = 'add-two-numbers';
update problems set execution_spec =
    '{"method":"lengthOfLongestSubstring","parameters":[{"name":"s","type":"STRING"}],"returnType":"INTEGER","comparison":"EXACT"}'
where slug = 'longest-substring-without-repeating-characters';
update problems set execution_spec =
    '{"method":"isValid","parameters":[{"name":"s","type":"STRING"}],"returnType":"BOOLEAN","comparison":"EXACT"}'
where slug = 'valid-parentheses';
update problems set execution_spec =
    '{"method":"mergeTwoLists","parameters":[{"name":"list1","type":"LIST_NODE"},{"name":"list2","type":"LIST_NODE"}],"returnType":"LIST_NODE","comparison":"EXACT"}'
where slug = 'merge-two-sorted-lists';
update problems set execution_spec =
    '{"method":"maxProfit","parameters":[{"name":"prices","type":"INTEGER_ARRAY"}],"returnType":"INTEGER","comparison":"EXACT"}'
where slug = 'best-time-to-buy-and-sell-stock';
update problems set execution_spec =
    '{"method":"maxSubArray","parameters":[{"name":"nums","type":"INTEGER_ARRAY"}],"returnType":"INTEGER","comparison":"EXACT"}'
where slug = 'maximum-subarray';
update problems set execution_spec =
    '{"method":"productExceptSelf","parameters":[{"name":"nums","type":"INTEGER_ARRAY"}],"returnType":"INTEGER_ARRAY","comparison":"EXACT"}'
where slug = 'product-of-array-except-self';
update problems set execution_spec =
    '{"method":"levelOrder","parameters":[{"name":"root","type":"TREE_NODE"}],"returnType":"INTEGER_MATRIX","comparison":"EXACT"}'
where slug = 'binary-tree-level-order-traversal';
update problems set execution_spec =
    '{"method":"numIslands","parameters":[{"name":"grid","type":"CHAR_MATRIX"}],"returnType":"INTEGER","comparison":"EXACT"}'
where slug = 'number-of-islands';
update problems set execution_spec =
    '{"method":"coinChange","parameters":[{"name":"coins","type":"INTEGER_ARRAY"},{"name":"amount","type":"INTEGER"}],"returnType":"INTEGER","comparison":"EXACT"}'
where slug = 'coin-change';
update problems set execution_spec =
    '{"method":"search","parameters":[{"name":"nums","type":"INTEGER_ARRAY"},{"name":"target","type":"INTEGER"}],"returnType":"INTEGER","comparison":"EXACT"}'
where slug = 'search-in-rotated-sorted-array';
update problems set execution_spec =
    '{"method":"canFinish","parameters":[{"name":"numCourses","type":"INTEGER"},{"name":"prerequisites","type":"INTEGER_MATRIX"}],"returnType":"BOOLEAN","comparison":"EXACT"}'
where slug = 'course-schedule';
update problems set execution_spec =
    '{"method":"trap","parameters":[{"name":"height","type":"INTEGER_ARRAY"}],"returnType":"INTEGER","comparison":"EXACT"}'
where slug = 'trapping-rain-water';
update problems set execution_spec =
    '{"method":"sortColors","parameters":[{"name":"nums","type":"INTEGER_ARRAY"}],"returnType":"VOID","resultMode":"ARGUMENT","resultArgumentIndex":0,"outputType":"INTEGER_ARRAY","comparison":"EXACT"}'
where slug = 'sort-colors';
update problems set execution_spec =
    '{"method":"canJump","parameters":[{"name":"nums","type":"INTEGER_ARRAY"}],"returnType":"BOOLEAN","comparison":"EXACT"}'
where slug = 'jump-game';
update problems set execution_spec =
    '{"method":"isHappy","parameters":[{"name":"n","type":"INTEGER"}],"returnType":"BOOLEAN","comparison":"EXACT"}'
where slug = 'happy-number';
update problems set execution_spec =
    '{"method":"singleNumber","parameters":[{"name":"nums","type":"INTEGER_ARRAY"}],"returnType":"INTEGER","comparison":"EXACT"}'
where slug = 'single-number';
update problems set execution_spec =
    '{"method":"reverseList","parameters":[{"name":"head","type":"LIST_NODE"}],"returnType":"LIST_NODE","comparison":"EXACT"}'
where slug = 'reverse-linked-list-recursively';
update problems set execution_spec =
    '{"method":"groupAnagrams","parameters":[{"name":"strs","type":"STRING_ARRAY"}],"returnType":"STRING_MATRIX","comparison":"UNORDERED_DEEP"}'
where slug = 'group-anagrams';
update problems set execution_spec =
    '{"method":"findRedundantConnection","parameters":[{"name":"edges","type":"INTEGER_MATRIX"}],"returnType":"INTEGER_ARRAY","comparison":"EXACT"}'
where slug = 'redundant-connection';
update problems set execution_spec =
    '{"method":"findKthLargest","parameters":[{"name":"nums","type":"INTEGER_ARRAY"},{"name":"k","type":"INTEGER"}],"returnType":"INTEGER","comparison":"EXACT"}'
where slug = 'kth-largest-element-in-an-array';
update problems set execution_spec =
    '{"method":"minSubArrayLen","parameters":[{"name":"target","type":"INTEGER"},{"name":"nums","type":"INTEGER_ARRAY"}],"returnType":"INTEGER","comparison":"EXACT"}'
where slug = 'minimum-size-subarray-sum';
update problems set execution_spec =
    '{"method":"dailyTemperatures","parameters":[{"name":"temperatures","type":"INTEGER_ARRAY"}],"returnType":"INTEGER_ARRAY","comparison":"EXACT"}'
where slug = 'daily-temperatures';
update problems set execution_spec =
    '{"method":"countTriples","parameters":[{"name":"n","type":"INTEGER"}],"returnType":"INTEGER","comparison":"EXACT"}'
where slug = 'count-square-sum-triples';
update problems set execution_spec =
    '{"method":"wordBreak","parameters":[{"name":"s","type":"STRING"},{"name":"wordDict","type":"STRING_ARRAY"}],"returnType":"BOOLEAN","comparison":"EXACT"}'
where slug = 'word-break';
update problems set execution_spec =
    '{"method":"uniquePaths","parameters":[{"name":"m","type":"INTEGER"},{"name":"n","type":"INTEGER"}],"returnType":"INTEGER","comparison":"EXACT"}'
where slug = 'unique-paths';
update problems set execution_spec =
    '{"method":"canWinNim","parameters":[{"name":"n","type":"INTEGER"}],"returnType":"BOOLEAN","comparison":"EXACT"}'
where slug = 'nim-game';
update problems set execution_spec =
    '{"method":"subsets","parameters":[{"name":"nums","type":"INTEGER_ARRAY"}],"returnType":"INTEGER_MATRIX","comparison":"UNORDERED_DEEP"}'
where slug = 'subsets';
update problems set execution_spec =
    '{"method":"generate","parameters":[{"name":"numRows","type":"INTEGER"}],"returnType":"INTEGER_MATRIX","comparison":"EXACT"}'
where slug = 'pascals-triangle';
update problems set execution_spec =
    '{"method":"maxPoints","parameters":[{"name":"points","type":"INTEGER_MATRIX"}],"returnType":"INTEGER","comparison":"EXACT"}'
where slug = 'max-points-on-a-line';
update problems set execution_spec =
    '{"method":"networkDelayTime","parameters":[{"name":"times","type":"INTEGER_MATRIX"},{"name":"n","type":"INTEGER"},{"name":"k","type":"INTEGER"}],"returnType":"INTEGER","comparison":"EXACT"}'
where slug = 'network-delay-time';
update problems set execution_spec =
    '{"method":"countPrimes","parameters":[{"name":"n","type":"INTEGER"}],"returnType":"INTEGER","comparison":"EXACT"}'
where slug = 'count-primes';
update problems set execution_spec =
    '{"method":"strStr","parameters":[{"name":"haystack","type":"STRING"},{"name":"needle","type":"STRING"}],"returnType":"INTEGER","comparison":"EXACT"}'
where slug = 'find-first-occurrence-in-a-string';

alter table problems
    add constraint chk_enabled_problem_has_execution_spec
    check (not enabled or execution_spec is not null);
