#let conf(
  authors: (),
  abstract: [],
  doc,
) = {
  set page(
  paper: "a4",
  header: align(
    right + horizon,
    context document.title,
  ),
  numbering: "1",
  columns: 2,
)

  show title: set text(size: 17pt)
  show title: set align(center)
  show title: set block(below: 1.2em)
  show heading.where(level: 1): set align(center)
  show heading.where(level: 1): set text(size: 13pt, weight: "regular")
  show heading.where(level: 1): smallcaps

  show heading.where(level: 2): set text(
    size: 11pt,
    weight: "regular",
    style: "italic",
  )
  show heading.where(level: 2): it => {
    it.body + [.]
  }
  set heading(numbering: "1.")
  set text(rgb("#232436"))
  set par(justify: true)
  set bibliography(style: "iso-690-numeric")

  place(
    top + center,
    float: true,
    scope: "parent",
    clearance: 2em,
    {
      title()

      let count = authors.len()
      let ncols = calc.min(count, 3)
      grid(
        columns: (1fr,) * ncols,
        row-gutter: 24pt,
        ..authors.map(author => [
          #author.name \
          #author.affiliation \
          #link("mailto:" + author.email)
        ]),
      )

      par(justify: false)[
        *Abstract* \
        #abstract
      ]

    }
  )

  outline()

  doc
}
