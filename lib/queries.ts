export const postsQuery = `*[_type == "post"] | order(publishedDate desc) {
    ...,
    "slug": slug.current
}`;

export const featuredPostsQuery = `*[_type == "post" && featured == true] | order(publishedDate desc) {
    ...,
    "slug": slug.current
}`;

export const postQuery = `*[_type == "post" && slug.current == $slug] {
    "post": {
        ...,
        "slug": slug.current
    },
    "previous": *[^.publishedDate > publishedDate] | order(publishedDate desc) [0] {
        title,
        "slug": slug.current
    },
    "next": *[^.publishedDate < publishedDate] | order(publishedDate asc) [0] {
        title,
        "slug": slug.current
    }
} | order(publishedDate desc) [0]`;

export const postSlugsQuery = `*[_type == "post" && defined(slug.current)][].slug.current`;

export const postUpdatedQuery = `*[_type == "post" && _id == $id].slug.current`;
