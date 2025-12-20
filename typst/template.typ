#import "conf.typ": conf

#set document(title: [this is a demo tile])

#show: conf.with(
  authors: (
    (
      name: "Nathan Sharp",
      affiliation: "Sharps Trust",
      email: "nathan@njs.dev",
    ),
    (
      name: "Eugene Deklan",
      affiliation: "Honduras State",
      email: "e.deklan@hstate.hn",
    ),
  ),
  abstract: lorem(80),
)

= Introduction
#lorem(90) @dirac

== Motivation
#lorem(140)

== Problem Statement
#lorem(50)

= Related Work
#lorem(200)

#bibliography("template.bib")