#import "/typst/conf.typ": conf

#set document(title: [The Unified Cloud-Native Parametric Exchange (UCPX) Framework])

#show: conf.with(
  authors: (
    (
      name: "Nathan Sharp",
      affiliation: "Independent",
      email: "nathan@njs.dev",
    ),
  ),
  abstract: 
    "This report presents a comprehensive research framework and draft proposal for a new International Standard: the Unified Cloud-Native Parametric Exchange (UCPX). This standard is specifically architected to address the requirements of preserving the parametric change tree across heterogeneous software suites, segregating mechanical, electrical, and assembly domains into distinct but interlinked file types, and optimizing data transport for modern cloud infrastructure via the WebDAV protocol.",
)

// --- Content ---

= Executive Summary and Strategic Rationale

The global engineering and manufacturing ecosystem stands at a critical juncture, burdened by a legacy of data fragmentation that inhibits innovation and imposes severe economic penalties. For decades, the Computer-Aided Design (CAD) industry has been characterized by a "Tower of Babel," where proprietary file formats—such as `.ipt` (Autodesk Inventor), `.f3d` (Autodesk Fusion), and `.sldprt` (SolidWorks)—effectively lock intellectual property into siloed environments. This lack of interoperability forces engineers to rely on "neutral" formats like STEP (ISO 10303) or IGES, which, while capable of transmitting explicit geometric shapes (Boundary Representation or B-Rep), fail catastrophically to preserve the "design intent"—the parametric history, constraints, and feature trees that define the functional logic of a model.

This report presents a comprehensive research framework and draft proposal for a new International Standard: the *Unified Cloud-Native Parametric Exchange (UCPX)*. This standard is specifically architected to address the requirements of preserving the parametric change tree across heterogeneous software suites, segregating mechanical, electrical, and assembly domains into distinct but interlinked file types, and optimizing data transport for modern cloud infrastructure via the WebDAV protocol.

== The Economic Imperative for Standardization
The economic friction caused by inadequate interoperability is not merely an inconvenience; it is a measurable drain on global GDP. Research conducted by the National Institute of Standards and Technology (NIST) has quantified these costs with alarming precision. In the U.S. capital facilities industry alone, imperfect interoperability imposes an estimated annual cost of \$15.8 billion.[1] Similarly, the automotive supply chain suffers losses exceeding \$1 billion annually due to the inability of tier-one suppliers and OEMs to seamlessly exchange design data.[2]

These costs manifest in three primary areas:
+ *Redundant Engineering Labor:* Engineers spend an estimated \$8.4 billion annually re-entering data, recreating lost features, and answering queries caused by "dumb" geometry transfers.[3]
+ *Supply Chain Ossification:* The inability to share native files forces supply chains into rigid, linear workflows. A supplier cannot easily propose a parametric optimization to a component if they cannot edit the source file.
+ *Cloud Latency and Version Control:* Traditional CAD files are monolithic binary structures. A minor change to a single screw in a gigabyte-scale assembly often necessitates the re-uploading of the entire file, choking bandwidth.[4]

== The Strategic Vision: UCPX
The proposed UCPX standard aims to solve these structural deficiencies through a tripartite architecture:
- *Universal Parametric History:* Adopting a *Macro-Parametric Approach (MPA)* to define a neutral taxonomy of modeling commands (e.g., "Extrude", "Fillet").[5]
- *Domain Segregation:* Replacing the monolithic single-file paradigm with a distributed file set—`.ucxp` for mechanical, `.ucxe` for electrical, and `.ucxa` for assembly.
- *Cloud-Native Protocol Optimization:* Leveraging *Open Packaging Conventions (OPC)* and *WebDAV* to support granular locking and partial updates.[6]

= Technical Architecture: The "Exploded" Data Model

To achieve the user's vision of a format that works well with WebDAV and segregates data types, the UCPX standard rejects the legacy approach of proprietary binary blobs. Instead, it adopts a package-based architecture that mirrors the structure of modern web applications.

== The Open Packaging Conventions (OPC) Foundation
The UCPX format is built upon *ISO/IEC 29500-2:2021 (Open Packaging Conventions)*. This is the same underlying technology used by Microsoft Office (`.docx`, `.xlsx`) and the 3MF additive manufacturing format.

Physically, a UCPX file is a *ZIP archive*. Logically, it is a file system within a file, containing a structured hierarchy of XML documents and binary assets.
- *Why OPC for WebDAV?* The primary advantage of OPC in a cloud context is addressability. A WebDAV-aware CAD client does not need to download an entire 500MB ZIP file to read metadata; it can issue an HTTP Range request to extract specific XML components.[7]

== The Three-File Ecosystem
The standard defines three distinct content types, each serving a specific engineering domain.

=== The Mechanical Part Format (`.ucxp`)
This format describes a single component. Unlike STEP, which stores only the final shape, the `.ucxp` stores the *recipe* for the shape.
- *The Procedural Definition (`/model/history.xml`):* This is the normative definition of the part containing a list of Standard Modeling Commands (SMCs).
- *The Explicit Cache (`/model/brep.stp`):* A cached copy of the final geometry in STEP AP242 Edition 2 format for lightweight visualization.
- *Parameters and Properties (`/props/core.xml`):* Global variables and metadata.

=== The Electrical Design Format (`.ucxe`)
The `.ucxe` format elevates electrical design to a first-class peer of the mechanical part.
- *Physical Definition:* Defines the PCB outline and mounting holes.
- *Connectivity:* A simplified netlist defining electrical connections, crucial for Mechatronic simulation.
- *Associativity:* Supports bi-directional associativity, allowing mechanical changes to propagate to electrical files as "proposals".

=== The Assembly Format (`.ucxa`)
The assembly file is a lightweight container holding no geometry of its own.
- *External References (XREFs):* Stores relative URIs to `.ucxp` and `.ucxe` files.
- *Constraint Solver Data (`/assembly/mates.xml`):* Defines rigid body mechanics (e.g., `Mate_Concentric`).
- *Configurations:* Defines variations of the assembly.

= The Design Intent Problem: Achieving a Unified Change Tree

== The Kernel Incompatibility Challenge
CAD software is built on mathematical "kernels" (e.g., Parasolid, ACIS, CGM). While a "Cylinder" is mathematically identical in all kernels, complex operations like blends often use proprietary algorithms. This is why previous standards failed to achieve "live" history exchange.

== The UCPX Solution: The Macro-Parametric Approach (MPA)
UCPX mandates a Macro-Parametric Approach. Instead of translating low-level mathematics, the standard translates high-level user intent using **Neutral Modeling Commands (NMC)**.

#figure(
  table(
    columns: (auto, auto, auto),
    inset: 10pt,
    align: horizon,
    [*NMC Command*], [*Parameters*], [`FeatureExtrusion3`], [`Feat_Fillet_Const`], [`FeatureFillet`], [`Feat_Pattern_Lin`], [`LinearPattern`],
  ),
  caption: [Proposed Neutral Modeling Command (NMC) Mapping]
)

== Handling Kernel Deviations: The Validation Loop
To handle mathematical deviations, UCPX includes a mandatory **Validation Loop**:
1. *Save:* Source system calculates geometric properties (Volume, Center of Mass).
2. *Open:* Receiving system rebuilds history.
3. *Verify:* Receiving system compares rebuilt properties against source metadata.
4. *Fallback:* If deviation exceeds tolerance, the system reverts to the "Frozen" B-Rep cache.

= Protocol Integration: WebDAV and Cloud Concurrency

== Granular Locking and Concurrency
WebDAV supports locking via the `LOCK` and `UNLOCK` methods. UCPX mandates ** Granular Resource Locking **.
- *Scenario:* User A opens an assembly.
- *Action:* The system issues `LOCK` requests *only* for the specific files User A intends to edit (e.g., `Part_X.ucxp`).
- *Result:* `Part_X` is write-protected for others, but `Part_Y` remains unlocked, enabling Real-Time Concurrent Engineering.[8]

== Handling "Lost Updates" and Conflicts
To prevent data loss, UCPX utilizes **Entity Tags (ETags)**. If an ETag on the server has changed since the file was opened, the server rejects the upload with `412 Precondition Failed`, forcing the client to merge changes.

= The ISO Standardization Pathway

The relevant body is **ISO/TC 184 (Automation systems and integration), Subcommittee 4 (Industrial data)**.

== The ISO Standards Lifecycle
+ **Preliminary (00):** Preliminary Work Item (PWI). Exploration of need.
+ **Proposal (10):** New Work Item Proposal (NWIP). Requires 2/3 majority vote.
+ **Preparatory (20):** Working Draft (WD). Core writing phase.
+ **Committee (30):** Committee Draft (CD). Circulation for comment.
+ **Enquiry (40):** Draft International Standard (DIS). Public voting.
+ **Publication (60):** International Standard (IS).

= Simulated Draft of the International Standard (UCPX)

*ISO/WD 10303-XXX* \
*Automation systems and integration — Unified Cloud-Native Parametric Exchange (UCPX) — Part 1: Architecture and Core Definitions*

*1. Scope* \
This document specifies a file format and data model for the exchange of feature-based, parametric engineering data between heterogeneous CAD systems. It defines a taxonomy of Standard Modeling Commands (SMC) and a container architecture based on Open Packaging Conventions.

*2. Data Architecture* \
*2.1 Container Format* \
All UCPX files (`.ucxp`, `.ucxe`, `.ucxa`) *shall* be valid ZIP archives conforming to ISO/IEC 29500-2.

*3. WebDAV Implementation Requirements* \
*3.1 Lock Depth* \
When opening an assembly for editing, client applications *shall* default to requesting WebDAV locks with `Depth: 0` on specific referenced component files.

= Conclusion

The proposed **Unified Cloud-Native Parametric Exchange (UCPX)** standard addresses the fundamental "missing link" in modern engineering. By moving away from monolithic binary files to a Macro-Parametric, OPC-based, WebDAV-optimized ecosystem, UCPX solves the critical problems of interoperability, domain segregation, and cloud performance.

