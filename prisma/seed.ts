import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// Real FIFA World Cup 2026 knockout data.
// - Round-of-32 fixtures (teams, dates, venues) from public schedules (SI.com / FIFA);
//   kickoff times converted from US Eastern (EDT = UTC-4) to UTC.
// - Round-of-16 pairings verified from the published bracket (CBS Sports); the deeper
//   QF/SF/Final tree follows the standard bracket path (best-effort — verify/adjust as
//   results come in). Later-round dates use the official round windows.
// - `flag` = flag-icons code (ISO alpha-2, or "gb-eng" for England).
//
// ROSTERS: indicative squads of well-known players so the prediction dropdowns are
// usable. Full 26-man squads change with call-ups/injuries and should be
// completed/verified by the admin via bulk-paste. (Intentional — see the plan.)

interface TeamDef {
  name: string;
  nameEn: string;
  flag: string;
  players?: string[];
}

const TEAMS: Record<string, TeamDef> = {
  ZA: { name: "جنوب أفريقيا", nameEn: "South Africa", flag: "za", players: ["رونويل ويليامز", "لايل فوستر", "بيرسي تاو", "تيبوهو موكوينا"] },
  CA: { name: "كندا", nameEn: "Canada", flag: "ca", players: ["ألفونسو ديفيز", "جوناثان ديفيد", "سيفوني", "تاجون بوكانان"] },
  BR: {
    name: "البرازيل",
    nameEn: "Brazil",
    flag: "br",
    players: ["فينيسيوس جونيور", "رودريغو", "رافينيا", "برونو غيماريش", "أليسون بيكر", "إيدر ميليتاو", "ماركينيوس", "كاسيميرو", "غابرييل مارتينيلي", "إندريك"],
  },
  JP: { name: "اليابان", nameEn: "Japan", flag: "jp", players: ["تاكيفوسا كوبو", "كاورو ميتوما", "واتارو إندو", "دايتشي كامادا"] },
  DE: { name: "ألمانيا", nameEn: "Germany", flag: "de", players: ["جمال موسيالا", "فلوريان فيرتز", "كاي هافيرتز", "يوشوا كيميش", "إلكاي غوندوغان"] },
  PY: { name: "باراغواي", nameEn: "Paraguay", flag: "py", players: ["ميغيل ألميرون", "خوليو إنسيسو", "أنطونيو سانابريا"] },
  NL: {
    name: "هولندا",
    nameEn: "Netherlands",
    flag: "nl",
    players: ["كودي جاكبو", "فيرجيل فان دايك", "ممفيس ديباي", "تشافي سيمونز", "فرينكي دي يونغ", "ديني دومفريس", "ماتياس دي ليخت", "رايان خرافنبيرخ"],
  },
  MA: {
    name: "المغرب",
    nameEn: "Morocco",
    flag: "ma",
    players: ["أشرف حكيمي", "يوسف النصيري", "سفيان أمرابط", "إبراهيم دياز", "ياسين بونو", "نصير مزراوي", "أزّالدين أوناحي", "حكيم زياش"],
  },
  CI: { name: "ساحل العاج", nameEn: "Côte d'Ivoire", flag: "ci", players: ["سيباستيان هالر", "فرانك كيسيه", "نيكولا بيبي", "أمادو ديالو"] },
  NO: { name: "النرويج", nameEn: "Norway", flag: "no", players: ["إرلينغ هالاند", "مارتن أوديغارد", "ألكسندر سورلوث", "أوسكار بوب"] },
  FR: {
    name: "فرنسا",
    nameEn: "France",
    flag: "fr",
    players: ["كيليان مبابي", "عثمان ديمبيلي", "أوريلين تشواميني", "ويليام ساليبا", "مايك مينيان", "أنطوان غريزمان", "إدواردو كامافينغا", "يوسف فوفانا", "برادلي باركولا"],
  },
  SE: { name: "السويد", nameEn: "Sweden", flag: "se", players: ["ألكسندر إيزاك", "فيكتور غيوكيريس", "ديجان كولوسيفسكي", "أنتوني إيلانغا"] },
  MX: { name: "المكسيك", nameEn: "Mexico", flag: "mx", players: ["سانتياغو خيمينيز", "إدسون ألفاريز", "هيرفينغ لوزانو", "أليكسيس فيغا"] },
  EC: { name: "الإكوادور", nameEn: "Ecuador", flag: "ec", players: ["مويسيس كايسيدو", "إينر فالنسيا", "بيرو هينكابييه", "كيندري باييز"] },
  ENG: {
    name: "إنجلترا",
    nameEn: "England",
    flag: "gb-eng",
    players: ["جود بيلينغهام", "هاري كين", "بوكايو ساكا", "فيل فودين", "ديكلان رايس", "كول بالمر", "بوكايو ساكا", "مارك غيهي", "جوردان بيكفورد", "أنتوني غوردون"].filter((v, i, a) => a.indexOf(v) === i),
  },
  CD: { name: "الكونغو الديمقراطية", nameEn: "DR Congo", flag: "cd", players: ["سيدريك باكامبو", "يوسف يزيتشي", "تشانسيل مبيمبا", "غاييل كاكوتا"] },
  BE: {
    name: "بلجيكا",
    nameEn: "Belgium",
    flag: "be",
    players: ["كيفن دي بروين", "جيريمي دوكو", "لوا أوبيني", "أميل لوكونغا", "يوري تيليمانس", "أليكسيس سيليمايكرز"],
  },
  SN: {
    name: "السنغال",
    nameEn: "Senegal",
    flag: "sn",
    players: ["ساديو ماني", "نيكولاس جاكسون", "بابا غاي", "إسماعيلا سار", "بوليه ديا", "إدريسا غانا غاي"],
  },
  US: {
    name: "الولايات المتحدة",
    nameEn: "United States",
    flag: "us",
    players: ["كريستيان بوليسيتش", "ويستون ماكيني", "يونس موسى", "تيموثي ويا", "فولارين بالوغون", "ماتّ تيرنر"],
  },
  BA: { name: "البوسنة والهرسك", nameEn: "Bosnia & Herzegovina", flag: "ba", players: ["إدين دجيكو", "سعيد بيراهيموفيتش", "إرمدين ديميروفيتش", "ميراليم بيانيتش"] },
  ES: {
    name: "إسبانيا",
    nameEn: "Spain",
    flag: "es",
    players: ["لامين يامال", "بيدري", "رودري", "نيكو ويليامز", "أوناي سيمون", "دانيال أولمو", "ألفارو موراتا", "فابيان رويز", "ميكيل ميرينو"],
  },
  AT: {
    name: "النمسا",
    nameEn: "Austria",
    flag: "at",
    players: ["ماركو أرناوتوفيتش", "كريستوف باومغارتنر", "كونراد لايمر", "ديفيد ألابا", "مارسيل سابيتزر", "باتريك فيمبر"],
  },
  PT: {
    name: "البرتغال",
    nameEn: "Portugal",
    flag: "pt",
    players: ["كريستيانو رونالدو", "برونو فيرنانديز", "برناردو سيلفا", "رافائيل لياو", "روبن دياش", "بيدرو نيتو", "فيتينيا", "جواو فيليكس", "روبن نيفيز"],
  },
  HR: {
    name: "كرواتيا",
    nameEn: "Croatia",
    flag: "hr",
    players: ["لوكا مودريتش", "أندريه كراماريتش", "ماتيو كوفاتشيتش", "جوشكو غفارديول", "إيفان بيريشيتش", "ماريو باشاليتش"],
  },
  CH: {
    name: "سويسرا",
    nameEn: "Switzerland",
    flag: "ch",
    players: ["غرانيت تشاكا", "بريل إمبولو", "دان إندويي", "مانويل أكانجي", "روبن فارغاس", "يان زومر"],
  },
  DZ: {
    name: "الجزائر",
    nameEn: "Algeria",
    flag: "dz",
    players: ["رياض محرز", "إسلام سليماني", "سعيد بن رحمة", "رامي بن سبعيني", "يوسف عطال", "بغداد بونجاح"],
  },
  AU: {
    name: "أستراليا",
    nameEn: "Australia",
    flag: "au",
    players: ["ماثيو ليكي", "جاكسون إيرفين", "كريغ غودوين", "هاري سوتار", "ماثيو رايان"],
  },
  EG: {
    name: "مصر",
    nameEn: "Egypt",
    flag: "eg",
    players: ["محمد صلاح", "عمر مرموش", "محمد النني", "تريزيغيه", "مصطفى محمد", "أحمد حجازي"],
  },
  AR: {
    name: "الأرجنتين",
    nameEn: "Argentina",
    flag: "ar",
    players: ["ليونيل ميسي", "لاوتارو مارتينيز", "خوليان ألفاريز", "إنزو فيرنانديز", "إميليانو مارتينيز", "رودريغو دي بول", "أليكسيس ماك أليستر", "كريستيان روميرو", "نيكولاس أوتاميندي"],
  },
  CV: { name: "الرأس الأخضر", nameEn: "Cabo Verde", flag: "cv", players: ["رايان مينديز", "غاري رودريغيز", "جيوفاني", "لوغان كوستا"] },
  CO: {
    name: "كولومبيا",
    nameEn: "Colombia",
    flag: "co",
    players: ["خاميس رودريغيز", "لويس دياز", "رافائيل بوريه", "خون دوران", "خيفرسون ليرما", "دافينسون سانشيز"],
  },
  GH: {
    name: "غانا",
    nameEn: "Ghana",
    flag: "gh",
    players: ["محمد قدوس", "إيناكي وليامز", "توماس بارتي", "خوردان أيو", "أنطوان سيمينيو"],
  },
};

// [homeKey, awayKey, kickoff (UTC ISO), venue] — code = `${home}-${away}`
const R32: [string, string, string, string][] = [
  ["ZA", "CA", "2026-06-28T19:00:00Z", "ملعب سوفاي، لوس أنجلوس"],
  ["BR", "JP", "2026-06-29T17:00:00Z", "ملعب NRG، هيوستن"],
  ["DE", "PY", "2026-06-29T20:30:00Z", "ملعب جيليت، بوسطن"],
  ["NL", "MA", "2026-06-30T01:00:00Z", "ملعب BBVA، غوادالوبي (المكسيك)"],
  ["CI", "NO", "2026-06-30T17:00:00Z", "ملعب AT&T، دالاس"],
  ["FR", "SE", "2026-06-30T21:00:00Z", "ملعب ميت لايف، نيوجيرسي"],
  ["MX", "EC", "2026-07-01T01:00:00Z", "ملعب الأزتيكا، مكسيكو سيتي"],
  ["ENG", "CD", "2026-07-01T16:00:00Z", "ملعب مرسيدس-بنز، أتلانتا"],
  ["BE", "SN", "2026-07-01T20:00:00Z", "ملعب لومن فيلد، سياتل"],
  ["US", "BA", "2026-07-02T00:00:00Z", "ملعب ليفايز، سان فرانسيسكو"],
  ["ES", "AT", "2026-07-02T19:00:00Z", "ملعب سوفاي، لوس أنجلوس"],
  ["PT", "HR", "2026-07-02T23:00:00Z", "ملعب BMO، تورنتو"],
  ["CH", "DZ", "2026-07-03T03:00:00Z", "ملعب BC بليس، فانكوفر"],
  ["AU", "EG", "2026-07-03T18:00:00Z", "ملعب AT&T، دالاس"],
  ["AR", "CV", "2026-07-03T22:00:00Z", "ملعب هارد روك، ميامي"],
  ["CO", "GH", "2026-07-04T01:30:00Z", "ملعب آروهيد، كانساس سيتي"],
];

const codeR32 = (h: string, a: string) => `R32:${h}-${a}`;

interface KnockoutDef {
  code: string;
  stage: "ROUND_OF_16" | "QUARTERFINAL" | "SEMIFINAL" | "FINAL";
  kickoff: string;
  venue: string;
  homeSource: string; // code of source match
  awaySource: string;
}

// Round of 16 — each fed by two R32 winners (verified pairings).
const R16: KnockoutDef[] = [
  { code: "R16-F", stage: "ROUND_OF_16", kickoff: "2026-07-04T18:00:00Z", venue: "ملعب NRG، هيوستن", homeSource: codeR32("ZA", "CA"), awaySource: codeR32("BR", "JP") },
  { code: "R16-G", stage: "ROUND_OF_16", kickoff: "2026-07-04T22:00:00Z", venue: "ملعب جيليت، بوسطن", homeSource: codeR32("DE", "PY"), awaySource: codeR32("NL", "MA") },
  { code: "R16-H", stage: "ROUND_OF_16", kickoff: "2026-07-05T18:00:00Z", venue: "ملعب ميت لايف، نيوجيرسي", homeSource: codeR32("CI", "NO"), awaySource: codeR32("FR", "SE") },
  { code: "R16-A", stage: "ROUND_OF_16", kickoff: "2026-07-05T22:00:00Z", venue: "ملعب الأزتيكا، مكسيكو سيتي", homeSource: codeR32("MX", "EC"), awaySource: codeR32("ENG", "CD") },
  { code: "R16-B", stage: "ROUND_OF_16", kickoff: "2026-07-06T18:00:00Z", venue: "ملعب لومن فيلد، سياتل", homeSource: codeR32("BE", "SN"), awaySource: codeR32("US", "BA") },
  { code: "R16-C", stage: "ROUND_OF_16", kickoff: "2026-07-06T22:00:00Z", venue: "ملعب سوفاي، لوس أنجلوس", homeSource: codeR32("ES", "AT"), awaySource: codeR32("CH", "DZ") },
  { code: "R16-D", stage: "ROUND_OF_16", kickoff: "2026-07-07T18:00:00Z", venue: "ملعب BMO، تورنتو", homeSource: codeR32("PT", "HR"), awaySource: codeR32("AU", "EG") },
  { code: "R16-E", stage: "ROUND_OF_16", kickoff: "2026-07-07T22:00:00Z", venue: "ملعب هارد روك، ميامي", homeSource: codeR32("AR", "CV"), awaySource: codeR32("CO", "GH") },
];

// Quarterfinals, Semifinals, Final (standard bracket path).
const LATER: KnockoutDef[] = [
  { code: "QF1", stage: "QUARTERFINAL", kickoff: "2026-07-09T22:00:00Z", venue: "ملعب هارد روك، ميامي", homeSource: "R16-A", awaySource: "R16-E" },
  { code: "QF2", stage: "QUARTERFINAL", kickoff: "2026-07-10T22:00:00Z", venue: "ملعب مرسيدس-بنز، أتلانتا", homeSource: "R16-B", awaySource: "R16-D" },
  { code: "QF3", stage: "QUARTERFINAL", kickoff: "2026-07-11T18:00:00Z", venue: "ملعب سوفاي، لوس أنجلوس", homeSource: "R16-C", awaySource: "R16-H" },
  { code: "QF4", stage: "QUARTERFINAL", kickoff: "2026-07-11T22:00:00Z", venue: "ملعب ميت لايف، نيوجيرسي", homeSource: "R16-G", awaySource: "R16-F" },
  { code: "SF1", stage: "SEMIFINAL", kickoff: "2026-07-14T22:00:00Z", venue: "ملعب AT&T، دالاس", homeSource: "QF1", awaySource: "QF2" },
  { code: "SF2", stage: "SEMIFINAL", kickoff: "2026-07-15T22:00:00Z", venue: "ملعب مرسيدس-بنز، أتلانتا", homeSource: "QF3", awaySource: "QF4" },
  { code: "FINAL", stage: "FINAL", kickoff: "2026-07-19T19:00:00Z", venue: "ملعب ميت لايف، نيوجيرسي", homeSource: "SF1", awaySource: "SF2" },
];

async function main() {
  // Idempotent reseed: clear existing rows in FK-safe order.
  await prisma.chatMessage.deleteMany();
  await prisma.prediction.deleteMany();
  await prisma.session.deleteMany();
  await prisma.auditLog.deleteMany();
  // Two passes for matches: clear source links first so we can delete freely.
  await prisma.match.updateMany({ data: { homeSourceMatchId: null, awaySourceMatchId: null } });
  await prisma.match.deleteMany();
  await prisma.player.deleteMany();
  await prisma.team.deleteMany();
  await prisma.participant.deleteMany();

  const teamId: Record<string, string> = {};
  const teamName: Record<string, string> = {};
  for (const [key, def] of Object.entries(TEAMS)) {
    const team = await prisma.team.create({
      data: { name: def.name, nameEn: def.nameEn, flagEmoji: def.flag },
    });
    teamId[key] = team.id;
    teamName[key] = def.name;
    if (def.players?.length) {
      await prisma.player.createMany({
        data: def.players.map((name) => ({ teamId: team.id, name })),
      });
    }
  }

  // Round of 32 — teams known.
  const matchId: Record<string, string> = {};
  for (const [h, a, kickoff, venue] of R32) {
    const m = await prisma.match.create({
      data: {
        stage: "ROUND_OF_32",
        homeTeamId: teamId[h],
        awayTeamId: teamId[a],
        kickoffAt: new Date(kickoff),
        venue,
        status: "SCHEDULED",
      },
    });
    matchId[codeR32(h, a)] = m.id;
  }

  // Knockout rounds — teams TBD, wired to source matches. Slot labels: R16 shows the
  // concrete R32 pairing; deeper rounds show a round-generic label.
  const roundLabel: Record<string, string> = {
    ROUND_OF_16: "دور الـ٣٢",
    QUARTERFINAL: "ثمن النهائي",
    SEMIFINAL: "ربع النهائي",
    FINAL: "نصف النهائي",
  };

  function slotLabel(def: KnockoutDef, source: string): string {
    if (def.stage === "ROUND_OF_16") {
      // source is an R32 code "R32:H-A"
      const [h, a] = source.replace("R32:", "").split("-");
      return `الفائز: ${teamName[h]} × ${teamName[a]}`;
    }
    return `الفائز من ${roundLabel[def.stage]}`;
  }

  for (const def of [...R16, ...LATER]) {
    const m = await prisma.match.create({
      data: {
        stage: def.stage,
        homeTeamId: null,
        awayTeamId: null,
        kickoffAt: new Date(def.kickoff),
        venue: def.venue,
        status: "SCHEDULED",
        homeSourceMatchId: matchId[def.homeSource],
        awaySourceMatchId: matchId[def.awaySource],
        homeSlotLabel: slotLabel(def, def.homeSource),
        awaySlotLabel: slotLabel(def, def.awaySource),
      },
    });
    matchId[def.code] = m.id;
  }

  const totalMatches = R32.length + R16.length + LATER.length;
  console.log(`Seeded ${Object.keys(TEAMS).length} teams and ${totalMatches} matches (R32→Final bracket).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
