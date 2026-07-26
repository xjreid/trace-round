delete from problems problem
where not problem.enabled
  and not exists (
      select 1
      from interview_questions question
      where question.problem_slug = problem.slug
  );

-- A problem already referenced by historical interview data cannot be deleted
-- without destroying that history. Such rows remain disabled and are never
-- returned by the problem catalog or selected for new interviews.
