# Group results need at least five people

Managers never see individual results, only group results, and any group smaller than five is replaced by a privacy mask (`MIN_GROUP` in `src/utils/results.ts`). Averages over two or three people let a manager infer individual answers, so the threshold applies everywhere group figures appear: team views, analytics filters and exports.
