export function technologyDashboardPath(subTechId) {
  return `/technology/${encodeURIComponent(subTechId)}`;
}

export function publicationPath(subTechId) {
  return `/publication/${encodeURIComponent(subTechId)}`;
}

export function patentPath(subTechId) {
  return `/patent/${encodeURIComponent(subTechId)}`;
}
