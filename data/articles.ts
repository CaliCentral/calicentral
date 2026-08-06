import type { Article } from "@/types/article";

const prototypeNotice =
  "This is fictional prototype editorial content. The people, crews, venues, events, and quotations in this story are invented to demonstrate Cali Central's publishing experience.";

export const articles = [
  {
    slug: "built-on-the-bars",
    title: "Built on the bars: the ritual behind a neighborhood training crew",
    dek: "At an imagined Los Angeles training ground, repetition is only part of the practice. The crew is also building trust, shared standards, and a place where progress belongs to everyone.",
    category: "Culture",
    author: "Cali Central Editorial",
    publicationDate: "2026-07-28",
    displayDate: "July 28, 2026",
    readTime: "6 min read",
    location: "Los Angeles, California",
    featured: true,
    homepageFeatured: true,
    issueNumber: "001",
    tags: ["Community", "Training culture", "Mentorship"],
    heroVariant: "signal",
    heroLabel: "Community / Shared practice",
    prototypeNotice,
    body: [
      {
        type: "paragraph",
        text: "For this fictional field note, the bars stand at the edge of an invented neighborhood court called Eastline Yard. At six in the evening, the concrete still carries the day's warmth. A loose circle forms before anyone reaches for the high bar: backpacks against the fence, water in the shade, wrists turning slowly through familiar ranges.",
      },
      {
        type: "paragraph",
        text: "The group calls itself the Eastline Assembly, though there is no membership list and no fixed coach. Some athletes arrive with carefully written sessions. Others come directly from work and decide what they can offer once they see who is there. The ritual is less about doing the same workout than beginning with the same question: what does everyone need tonight?",
      },
      {
        type: "heading",
        text: "The circle before the session",
        id: "the-circle-before-the-session",
      },
      {
        type: "paragraph",
        text: "One person checks the bolts and landing space. Another names the movements they hope to practice. A third quietly pairs a newcomer with someone who can explain the setup. It takes only a few minutes, but it changes the pace of the evening. No one has to interrupt a difficult attempt to ask where they belong.",
      },
      {
        type: "paragraph",
        text: "The Assembly's oldest rule is that a session starts with the ground, not the skill. Clear the area. Test the bar. Agree on turns. Name any pain before ambition has a chance to hide it. The rule is practical, but it is also social: attention is treated as something the crew can share.",
      },
      {
        type: "list",
        style: "unordered",
        items: [
          "Inspect the training space before the first attempt.",
          "Say the goal of the session out loud, even if the goal is simply to move.",
          "Give corrections only after asking whether they are wanted.",
          "Leave time for one final round that the group chooses together.",
        ],
      },
      {
        type: "pullQuote",
        quote:
          "The bar does not remember who went first. The crew remembers who made room.",
        attribution: "Eastline Assembly maxim (fictional)",
      },
      {
        type: "heading",
        text: "Progress without a spotlight",
        id: "progress-without-a-spotlight",
      },
      {
        type: "paragraph",
        text: "Much of the evening is deliberately ordinary. An athlete rehearses the entry to a hold without completing it. Two friends trade sets of measured pull-ups. Near the low rail, a beginner learns how to step down from support with control. The most experienced people are not always performing the largest movements; often they are watching feet, moving a bag out of a landing zone, or counting a tempo.",
      },
      {
        type: "subheading",
        text: "A shared record",
        id: "a-shared-record",
      },
      {
        type: "paragraph",
        text: "The crew keeps a weathered notebook in a sealed box beneath the bench. It contains no leaderboard. Each page records a date, the names people choose to write, and a sentence about what changed: a first pain-free hang, a cleaner exit, the confidence to try in front of others. Reading backward turns individual milestones into a history of the place.",
      },
      {
        type: "factBox",
        title: "The fictional Eastline session",
        items: [
          "Opening: space check and individual goals",
          "Main work: small groups organized by movement",
          "Shared round: one accessible drill chosen together",
          "Closing: notes, equipment check, and next-session handoff",
        ],
      },
      {
        type: "paragraph",
        text: "That record also makes room for absence. If someone has not trained for several weeks, they do not return to a wall of personal bests. They return to a page that says the crew practiced, adjusted, and kept a place open. Continuity comes from showing how the session was held, not pretending every athlete was always present.",
      },
      {
        type: "divider",
        label: "Field note / 01",
      },
      {
        type: "heading",
        text: "A neighborhood vocabulary",
        id: "a-neighborhood-vocabulary",
      },
      {
        type: "paragraph",
        text: "Over time, the Assembly develops a language of its own. “Make it repeatable” means an attempt should leave enough clarity to understand the next one. “Give the bar back” means finish a turn without drifting into somebody else's space. “Quiet set” means no cheering until the athlete has safely stepped away. None of these phrases are official technique. Together, they are a compact map of the group's priorities.",
      },
      {
        type: "callout",
        label: "Prototype field detail",
        title: "The last round belongs to the room",
        text: "The closing drill is selected for broad participation: a controlled hang, a line exercise on the ground, or a timed support scaled to each athlete. The point is not equal output. It is a shared ending.",
      },
      {
        type: "paragraph",
        text: "As the light drops, the strongest image is not a single skill. It is the reset between attempts: one athlete steps away, another wipes the rail, someone farther back raises a hand to ask whose turn is next. The ritual has made the session legible. Everyone can see how to enter it, how to contribute, and how to leave the space ready for whoever arrives tomorrow.",
      },
    ],
    relatedSlugs: [
      "one-evening-at-harbor-park",
      "language-of-control",
      "after-the-last-round",
    ],
  },
  {
    slug: "language-of-control",
    title: "The quiet language of control",
    dek: "An illustrative conversation with three fictional coaches about static strength, patient progress, and the cues that help athletes make difficult positions feel deliberate.",
    category: "Training",
    author: "Cali Central Editorial",
    publicationDate: "2026-07-24",
    displayDate: "July 24, 2026",
    readTime: "7 min read",
    location: "Oakland, California",
    featured: false,
    homepageFeatured: false,
    issueNumber: "002",
    tags: ["Static strength", "Coaching", "Technique"],
    heroVariant: "field",
    heroLabel: "Training / Static strength",
    prototypeNotice,
    body: [
      {
        type: "paragraph",
        text: "In this prototype editorial feature, three composite coaches meet at an imagined Oakland studio before the first class of the day. The room is almost silent. A row of low parallettes faces a white training wall marked with simple lines: shoulder, hip, hand, floor. The coaches disagree about plenty, but they begin from the same premise. Control is not the absence of effort. It is effort that an athlete can read.",
      },
      {
        type: "paragraph",
        text: "That distinction matters in static strength, where an attempt can look motionless from a distance while the athlete is processing a dozen decisions. A wrist shifts. The ribs settle. One shoulder loses height and is brought back. The coaches are interested in those small negotiations because they reveal whether a position is understood or merely survived.",
      },
      {
        type: "heading",
        text: "A cue should open a door",
        id: "a-cue-should-open-a-door",
      },
      {
        type: "paragraph",
        text: "The first fictional coach keeps cues brief: “push the floor away,” “make the line longer,” “leave the set with the same shape.” The words are not treated as universal instructions. They are tests. If a phrase helps an athlete organize the next attempt, it stays. If it creates more tension without more clarity, the coach changes it.",
      },
      {
        type: "paragraph",
        text: "The second coach starts with questions instead. Where did the position first feel uncertain? What could the athlete still see? Did the exit feel chosen? The answers are imperfect, but that is useful. They move the conversation away from a binary pass or fail and toward the sequence the athlete actually experienced.",
      },
      {
        type: "pullQuote",
        quote:
          "A good hold is not quiet because nothing is happening. It is quiet because the decisions agree.",
        attribution: "Composite coach (fictional)",
      },
      {
        type: "subheading",
        text: "Three ways to make an attempt legible",
        id: "three-ways-to-make-an-attempt-legible",
      },
      {
        type: "list",
        style: "ordered",
        items: [
          "Name one shape to protect before the set begins.",
          "Choose an exit that can be practiced as deliberately as the entry.",
          "Record one observation before adding another correction.",
        ],
      },
      {
        type: "paragraph",
        text: "The third coach uses time as a teaching tool, but not simply by making holds longer. Some attempts are intentionally short so the athlete can leave while the position remains recognizable. Others include a pause before the entry, creating space to check hands and breath. In this imagined practice, duration is one variable among many, not the verdict on the set.",
      },
      {
        type: "heading",
        text: "Patience with a structure",
        id: "patience-with-a-structure",
      },
      {
        type: "paragraph",
        text: "“Be patient” can become empty advice when it offers no next action. The coaches give patience a shape. They narrow the session to one position, set a clear number of high-attention attempts, and place easier work between them. An athlete knows what is being protected and when the demanding work will end.",
      },
      {
        type: "factBox",
        title: "Illustrative session framework",
        items: [
          "Arrival: choose one technical question",
          "Preparation: rehearse the entry and exit separately",
          "Main sets: a limited number of deliberate attempts",
          "Review: keep one useful cue and release the rest",
        ],
      },
      {
        type: "paragraph",
        text: "This structure also gives coaches a boundary. They do not need to repair every visible detail in one morning. One may watch the shoulder line while another takes notes on the exit. A later session can address what remains. The athlete is not treated as a collection of errors competing for immediate attention.",
      },
      {
        type: "divider",
        label: "Training note / 02",
      },
      {
        type: "heading",
        text: "What the camera cannot decide",
        id: "what-the-camera-cannot-decide",
      },
      {
        type: "paragraph",
        text: "A short recording can help compare positions, but the fictional coaches refuse to let the frame become the only authority. The athlete still has to describe pressure, confidence, and whether the exit remained available. A clean silhouette may conceal confusion; an unfinished position may contain the clearest decision of the day.",
      },
      {
        type: "callout",
        label: "Coaching principle",
        title: "Keep the cue that survives the session",
        text: "At the end of the prototype conversation, each athlete writes down one phrase that remained useful under effort. Everything else is available for revision.",
      },
      {
        type: "paragraph",
        text: "By the time the studio door opens, the white wall is unchanged. The work has not produced a dramatic transformation. It has produced a more precise vocabulary: entry, shape, decision, exit. That vocabulary is quiet by design. It gives the athlete something durable to carry into the next attempt, long after the coach has stepped away.",
      },
    ],
    relatedSlugs: [
      "built-on-the-bars",
      "after-the-last-round",
      "judging-the-line",
    ],
  },
  {
    slug: "judging-the-line",
    title: "Judging the line between difficulty and execution",
    dek: "A fictional roundtable asks what a competition score should communicate—to the athlete taking the risk, the judge making the decision, and the audience trying to follow both.",
    category: "Competition",
    author: "Cali Central Editorial",
    publicationDate: "2026-07-19",
    displayDate: "July 19, 2026",
    readTime: "7 min read",
    location: "San Diego, California",
    featured: false,
    homepageFeatured: false,
    issueNumber: "003",
    tags: ["Judging", "Competition format", "Standards"],
    heroVariant: "frame",
    heroLabel: "Competition / Standards",
    prototypeNotice,
    body: [
      {
        type: "paragraph",
        text: "The scenario is invented: four composite participants sit around a table in a fictional San Diego workshop. One is an athlete, one a judge, one an event producer, and one a coach. On the wall, a sample scorecard from an imaginary competition has been enlarged until every box is visible. The group has one assignment—explain what the numbers mean without relying on insider language.",
      },
      {
        type: "paragraph",
        text: "The first tension appears quickly. Difficulty attracts attention because it names the ambition of a performance. Execution asks a slower question: how completely did the athlete deliver that ambition? Treat either one as the whole score and the round becomes distorted. Treat both as unexplained totals and the audience sees a result without seeing the decision.",
      },
      {
        type: "heading",
        text: "Start with the promise of the category",
        id: "start-with-the-promise-of-the-category",
      },
      {
        type: "paragraph",
        text: "Before assigning points, the fictional judge wants each category to make a promise. Difficulty should describe the demand of the selected material. Execution should describe how clearly that material was completed. Composition, if included, should describe how the pieces form a deliberate run. The language is provisional, but every point now has a job.",
      },
      {
        type: "paragraph",
        text: "The athlete pushes for examples at the edges. What happens when a highly difficult element is attempted but not established? How is a controlled, simpler sequence separated from one that takes greater risk? A standard earns trust, the group argues, when it helps people anticipate those difficult decisions rather than only defending them afterward.",
      },
      {
        type: "factBox",
        title: "Prototype scorecard architecture",
        items: [
          "Difficulty: the demand of material that is clearly presented",
          "Execution: control, completion, and intentional transitions",
          "Composition: how the run is organized and developed",
          "Deductions: named events applied consistently and shown separately",
        ],
      },
      {
        type: "pullQuote",
        quote:
          "A score should be concise. The standard behind it should never be mysterious.",
        attribution: "Illustrative roundtable participant",
      },
      {
        type: "heading",
        text: "Separate the decision from the display",
        id: "separate-the-decision-from-the-display",
      },
      {
        type: "paragraph",
        text: "Judges need enough detail to record a decision consistently. Spectators need a view they can understand at event speed. Those are related design problems, not identical interfaces. The working scorecard may contain several marks; the public board might show category totals, deductions, and a final number in a stable order.",
      },
      {
        type: "subheading",
        text: "The value of a named deduction",
        id: "the-value-of-a-named-deduction",
      },
      {
        type: "paragraph",
        text: "A deduction becomes easier to understand when it is attached to a defined event: time, boundary, incomplete finish, or another clearly published condition. The roundtable rejects a vague “overall impression” penalty because neither athlete nor audience could locate what changed. If discretion is part of a category, its scope should be stated before the first round.",
      },
      {
        type: "list",
        style: "unordered",
        items: [
          "Publish category definitions before competition day.",
          "Use the same category order on judge sheets and audience graphics.",
          "Show deductions separately from positive category scores.",
          "Give athletes a documented path to request score clarification.",
        ],
      },
      {
        type: "divider",
        label: "Roundtable / 03",
      },
      {
        type: "heading",
        text: "Calibration is an editorial act",
        id: "calibration-is-an-editorial-act",
      },
      {
        type: "paragraph",
        text: "The sample panel reviews three invented runs before the workshop begins. The purpose is not to force identical instincts. It is to expose where the written standard leaves room for incompatible interpretations. When scores diverge, the judges must point to language, not status or reputation, and decide whether the standard needs a sharper edge.",
      },
      {
        type: "paragraph",
        text: "The coach adds another test: could an athlete use the published criteria to shape preparation without reducing the performance to box-ticking? Standards should reward clarity, but they should not prescribe one style. A usable framework marks the field of play while leaving room for athletes to make meaningful choices inside it.",
      },
      {
        type: "callout",
        label: "Audience test",
        title: "Can the change be explained in one sentence?",
        text: "When two fictional scores differ, the event graphic should help a commentator identify the category that moved and the published reason—without inventing certainty the scorecard does not contain.",
      },
      {
        type: "paragraph",
        text: "The group finishes without claiming a universal formula. Instead, the enlarged scorecard is covered in more precise questions. That is the useful result. Difficulty and execution do not need to stop competing for attention; they need a shared structure that makes their relationship visible. The line between them becomes credible when athletes can prepare for it, judges can defend it, and audiences can follow where it bends.",
      },
    ],
    relatedSlugs: [
      "building-a-stage-the-audience-can-understand",
      "after-the-last-round",
      "language-of-control",
    ],
  },
  {
    slug: "after-the-last-round",
    title: "After the last round",
    dek: "A fictional athlete journal about the hours after competition, the pressure carried into a final, and the quieter work of returning to practice with a clear mind.",
    category: "Athlete Journal",
    author: "Cali Central Editorial",
    publicationDate: "2026-07-15",
    displayDate: "July 15, 2026",
    readTime: "6 min read",
    location: "Sacramento, California",
    featured: false,
    homepageFeatured: false,
    issueNumber: "004",
    tags: ["Athlete journal", "Recovery", "Competition"],
    heroVariant: "signal",
    heroLabel: "Journal / Reset",
    prototypeNotice,
    body: [
      {
        type: "paragraph",
        text: "This fictional journal follows a composite athlete named Mara after the final round of an invented Sacramento event. Her account begins behind the stage, where the competition noise has thinned into rolling cases and short conversations. The result is already posted. What remains is the gap between the performance she imagined and the one her body actually delivered.",
      },
      {
        type: "paragraph",
        text: "I thought the last round would end cleanly. In every version I rehearsed, I would step away from the bars and know exactly what the day meant. Instead, I remembered fragments: a rushed opening, one transition that felt better than it looked in practice, and the instant before my final attempt when the room became too sharp.",
      },
      {
        type: "heading",
        text: "Preparation has its own momentum",
        id: "preparation-has-its-own-momentum",
      },
      {
        type: "paragraph",
        text: "For six imagined weeks, my calendar had pointed in one direction. Meals, sleep, training, and travel were arranged around a time printed on a schedule. That focus helped me arrive prepared, but it also made the competition feel larger each day. By finals morning, every ordinary choice seemed connected to the result.",
      },
      {
        type: "paragraph",
        text: "My coach kept returning me to a smaller plan: see the first grip, finish the first shape, breathe before the next decision. I understood the words. Under pressure, I still tried to perform the entire round at once. The mistake was not ambition. It was leaving no room to notice where I actually was.",
      },
      {
        type: "pullQuote",
        quote:
          "I had prepared a sequence. I was still learning how to stay inside it.",
        attribution: "From the fictional journal",
      },
      {
        type: "heading",
        text: "The hour with no assignment",
        id: "the-hour-with-no-assignment",
      },
      {
        type: "paragraph",
        text: "After awards, there was nothing left to warm up for. I sat with my shoes untied and felt the reflex to review every second. The urge looked productive, but I knew the first version of the story would be written by fatigue. I sent one message to say I was safe, drank water, and left the analysis for morning.",
      },
      {
        type: "factBox",
        title: "Mara's fictional post-round reset",
        items: [
          "First hour: basic needs, no technical review",
          "That evening: record emotions without turning them into conclusions",
          "Next morning: watch once for sequence, once for decisions",
          "First return: choose one familiar movement with no score attached",
        ],
      },
      {
        type: "paragraph",
        text: "The next day, the recording was kinder than memory and less flattering than hope. Both were useful. I saw where the opening accelerated. I also saw a controlled recovery I had forgotten completely. The video did not tell me whether the competition was good or bad. It showed me that the round contained more than the single error my mind had selected.",
      },
      {
        type: "divider",
        label: "Athlete journal / 04",
      },
      {
        type: "heading",
        text: "Returning without a verdict",
        id: "returning-without-a-verdict",
      },
      {
        type: "paragraph",
        text: "My first session back was intentionally plain. No full combinations. No attempt to prove the preparation had worked. I repeated an entry I trusted, held a simple position, and practiced stepping away before effort changed the shape. The room felt larger without a countdown in it.",
      },
      {
        type: "subheading",
        text: "Keep, change, release",
        id: "keep-change-release",
      },
      {
        type: "list",
        style: "unordered",
        items: [
          "Keep the warm-up that made the opening feel familiar.",
          "Change the cue that asked me to think about the entire round.",
          "Release the idea that one placement can summarize the preparation.",
        ],
      },
      {
        type: "paragraph",
        text: "The list gave review a boundary. It preserved what had helped, named one practical change, and stopped the result from spreading into every part of training. I could be disappointed without making disappointment the program.",
      },
      {
        type: "callout",
        label: "Journal note",
        title: "Recovery is not an eraser",
        text: "In this fictional account, the athlete does not rush to feel neutral about the result. The reset creates enough distance to learn from it without carrying the final score into every future set.",
      },
      {
        type: "paragraph",
        text: "A week later, I finished the same transition that had broken down in the final. Nobody announced it. I did not need them to. The movement was no longer evidence for or against competition day; it was simply part of practice again. The last round had ended. Training had made space for the next one.",
      },
    ],
    relatedSlugs: [
      "language-of-control",
      "judging-the-line",
      "built-on-the-bars",
    ],
  },
  {
    slug: "one-evening-at-harbor-park",
    title: "One evening at Harbor Park",
    dek: "At a fictional Long Beach park, a single open-air session shows how a training space can hold serious practice, first attempts, and the unplanned exchanges that give a local scene its character.",
    category: "Field Note",
    author: "Cali Central Editorial",
    publicationDate: "2026-07-12",
    displayDate: "July 12, 2026",
    readTime: "6 min read",
    location: "Long Beach, California",
    featured: false,
    homepageFeatured: false,
    issueNumber: "005",
    tags: ["Field note", "Open-air training", "Community"],
    heroVariant: "field",
    heroLabel: "Field note / Local motion",
    prototypeNotice,
    body: [
      {
        type: "paragraph",
        text: "Harbor Park, as it appears here, is an invented Long Beach setting created for this fictional field note. Its training area sits between a broad walking path and a line of wind-shaped trees. By late afternoon, every station has developed a different rhythm: measured strength sets at the high bar, footwork on the open concrete, and a patient handstand exchange beside the low rails.",
      },
      {
        type: "paragraph",
        text: "There is no host and no formal start time. The session assembles through recognition. A nod becomes a warm-up set. A question about space becomes an invitation to share it. People arrive with separate plans, but the park keeps placing those plans next to one another.",
      },
      {
        type: "heading",
        text: "The first exchange",
        id: "the-first-exchange",
      },
      {
        type: "paragraph",
        text: "Near the parallel bars, an experienced athlete notices a newcomer watching the setup for a support hold. She does not offer a correction immediately. She asks what the newcomer is trying to feel. The answer—steady shoulders, a safe way down—turns the conversation toward a lower station and a version of the movement that can be repeated.",
      },
      {
        type: "paragraph",
        text: "The adjustment takes less than a minute. Its effect lasts through the next several sets. The newcomer stops scanning the park for permission and begins setting a clear turn. Other athletes work around the pair without making the exchange into a performance.",
      },
      {
        type: "pullQuote",
        quote:
          "A public session works when advice feels like an open door, not a spotlight.",
        attribution: "Cali Central field note",
      },
      {
        type: "heading",
        text: "Many sessions in one frame",
        id: "many-sessions-in-one-frame",
      },
      {
        type: "paragraph",
        text: "At the far bar, two athletes are timing rest with an old kitchen timer. Their work is precise and mostly quiet. Across the concrete, a loose group is building a movement sequence by taking turns adding one transition. The two practices look unrelated until a timer sounds and both groups pause at once. For a moment, the entire space resets.",
      },
      {
        type: "factBox",
        title: "Harbor Park, 6:18 p.m. (fictional)",
        items: [
          "High bar: controlled pulling sets",
          "Low rails: support and exit practice",
          "Open floor: collaborative movement sequence",
          "Bench line: rest, notes, and equipment checks",
        ],
      },
      {
        type: "subheading",
        text: "The session's informal infrastructure",
        id: "the-sessions-informal-infrastructure",
      },
      {
        type: "paragraph",
        text: "The park offers bars and ground. The athletes supply the rest. A spare resistance band is passed along without ceremony. Someone keeps the walking path clear when a bag drifts outward. When the light begins to change, phone flashlights are used only to pack equipment, not to extend a set beyond what the space can safely hold.",
      },
      {
        type: "list",
        style: "unordered",
        items: [
          "Ask before joining a rotation.",
          "Keep landing zones and public paths clear.",
          "Return borrowed equipment to the place it came from.",
          "Make the final set early enough to leave together.",
        ],
      },
      {
        type: "divider",
        label: "Field note / 05",
      },
      {
        type: "heading",
        text: "What remains after the attempts",
        id: "what-remains-after-the-attempts",
      },
      {
        type: "paragraph",
        text: "No single athlete becomes the subject of the evening. The memorable action is circulation: attention moves toward a first attempt, then back to an advanced set, then toward the practical work of clearing a station. Serious training and casual arrival are not competing uses of the park. The shared etiquette lets them occupy the same frame.",
      },
      {
        type: "callout",
        label: "Field observation",
        title: "Open space, visible standards",
        text: "The fictional park has no posted training code. Its standards become visible through small actions—asking, spotting, resetting, and making room before the next person has to request it.",
      },
      {
        type: "paragraph",
        text: "At the end, the collaborative sequence is never performed from beginning to end. It does not need to be. One athlete remembers the opening, another the turn in the middle, and a third records the final transition in a notebook. The unfinished line gives them a reason to meet again. Harbor Park empties without a closing announcement, carrying the shape of the next session with it.",
      },
    ],
    relatedSlugs: [
      "built-on-the-bars",
      "language-of-control",
      "building-a-stage-the-audience-can-understand",
    ],
  },
  {
    slug: "building-a-stage-the-audience-can-understand",
    title: "Building a stage the audience can understand",
    dek: "Competition presentation is more than decoration. This prototype analysis explores how rounds, judging graphics, commentary, and venue cues can give every performance a clearer narrative.",
    category: "Analysis",
    author: "Cali Central Editorial",
    publicationDate: "2026-07-08",
    displayDate: "July 8, 2026",
    readTime: "8 min read",
    location: "California / Worldwide",
    featured: false,
    homepageFeatured: false,
    issueNumber: "006",
    tags: ["Event design", "Broadcast", "Audience"],
    heroVariant: "frame",
    heroLabel: "Analysis / Event design",
    prototypeNotice,
    body: [
      {
        type: "paragraph",
        text: "Imagine arriving midway through a fictional calisthenics event. An athlete is on the floor, a timer is moving, and numbers from the previous round remain on a screen. The energy is obvious. The structure is not. You cannot tell whether this is qualification or final, which score is live, or what the athlete must complete before time expires.",
      },
      {
        type: "paragraph",
        text: "That confusion is not solved by making the screen brighter. A legible stage begins earlier, with the order of information. The event must decide what the audience needs before a round, what belongs during the performance, and what should wait until the athlete is clear of the field.",
      },
      {
        type: "heading",
        text: "Give every round a beginning",
        id: "give-every-round-a-beginning",
      },
      {
        type: "paragraph",
        text: "In this prototype format, a short transition card establishes four facts: round, athlete, time, and scoring categories. The announcer uses the same terms that appear on the display. Venue signage repeats the round name at the edge of the floor. Nobody has to assemble the format from three competing vocabularies.",
      },
      {
        type: "paragraph",
        text: "Once the performance begins, the display becomes quieter. The active timer remains visible. The athlete's name and current round stay fixed. Unconfirmed scores do not appear as if they were final, and decorative motion does not compete with the movement people came to watch.",
      },
      {
        type: "factBox",
        title: "Illustrative audience sequence",
        items: [
          "Before: round, athlete, format, and time allowance",
          "During: stable identity, active timer, and field status",
          "After: category scores, named deductions, and final total",
          "Between rounds: standings context and what happens next",
        ],
      },
      {
        type: "pullQuote",
        quote:
          "The graphic should reduce uncertainty around the performance, not compete to become the performance.",
        attribution: "Cali Central prototype analysis",
      },
      {
        type: "heading",
        text: "Commentary as a bridge",
        id: "commentary-as-a-bridge",
      },
      {
        type: "paragraph",
        text: "Commentary can connect specialist knowledge to the action without translating every movement into a lecture. A useful call identifies the athlete's intended structure, marks a meaningful change, and leaves room for the audience to watch. When a score arrives, the commentator points to the category that moved rather than guessing at an unseen deliberation.",
      },
      {
        type: "subheading",
        text: "Describe the decision, preserve the uncertainty",
        id: "describe-the-decision-preserve-the-uncertainty",
      },
      {
        type: "paragraph",
        text: "If a result is provisional, the language and graphic should say so. If a deduction has not been identified, the broadcast should not invent an explanation. Clear presentation includes the confidence to mark what is still unresolved. That honesty protects the audience from false precision and gives officials space to finish the process.",
      },
      {
        type: "list",
        style: "ordered",
        items: [
          "Use one published vocabulary across rules, graphics, and commentary.",
          "Show status with words and layout, not color alone.",
          "Reserve motion for real transitions such as the start of a round.",
          "Explain where a score changed without speculating about private discussion.",
          "Tell the audience what happens next before leaving the current result.",
        ],
      },
      {
        type: "divider",
        label: "Analysis frame / 06",
      },
      {
        type: "heading",
        text: "The venue is part of the interface",
        id: "the-venue-is-part-of-the-interface",
      },
      {
        type: "paragraph",
        text: "People in the room do not experience the event through a broadcast frame. They need sightlines to a timer, a clear boundary around the active field, and an obvious place to look when results are posted. The same information architecture should survive at different scales—from a large screen to a printed run order at the entrance.",
      },
      {
        type: "paragraph",
        text: "The strongest visual identity grows from that structure. Red can mark the active round. A frame number can connect the floor graphic to the program. A consistent category order can become recognizable over a full day. Style is doing useful work because it helps the audience locate itself in the competition.",
      },
      {
        type: "callout",
        label: "Prototype design test",
        title: "Enter at any moment",
        text: "A new spectator should be able to identify the active round, the athlete, the clock, and the next transition within a brief glance—without needing a separate explanation of the interface.",
      },
      {
        type: "paragraph",
        text: "A comprehensible stage does not make the sport simple. It makes complexity available. Athletes can take risks inside a format that is visible, judges can communicate decisions in a stable system, and audiences can build understanding from one round to the next. The presentation recedes at the right moment, leaving the performance at the center of the frame.",
      },
    ],
    relatedSlugs: [
      "judging-the-line",
      "after-the-last-round",
      "one-evening-at-harbor-park",
    ],
  },
] as const satisfies readonly Article[];

export const featuredArticle =
  articles.find((article) => article.featured) ?? articles[0];

export const homepageFeaturedArticle =
  articles.find((article) => article.homepageFeatured) ?? featuredArticle;

export function getArticleBySlug(slug: string): Article | undefined {
  return articles.find((article) => article.slug === slug);
}

export function getRelatedArticles(
  relatedSlugs: readonly string[],
): readonly Article[] {
  return relatedSlugs.flatMap((slug) => {
    const article = getArticleBySlug(slug);

    return article ? [article] : [];
  });
}
