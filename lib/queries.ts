export const postsQuery = `*[_type == "post"] | order(publishedDate desc) {
    ...,
    "slug": slug.current
}`;

export const featuredPostsQuery = `*[_type == "post" && featured == true] | order(publishedDate desc) {
    ...,
    "slug": slug.current
}`;

export const postQuery = `{
    "post": *[_type == "post" && slug.current == $slug] | order(_updatedAt desc) [0]
}`;

export const postSlugsQuery = `*[_type == "post" && defined(slug.current)][].slug.current`;

export const postUpdatedQuery = `*[_type == "post" && _id == $id].slug.current`;
