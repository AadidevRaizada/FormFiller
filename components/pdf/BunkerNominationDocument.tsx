import {
  Document,
  Page,
  View,
  Text,
  Image,
  StyleSheet,
} from "@react-pdf/renderer";
import { ASEAN_LOGO } from "@/lib/logo";

/**
 * Props for the BunkerNominationDocument component.
 * Matches TransactionRecord minus _id and createdAt.
 */
export interface BunkerNominationDocumentProps {
  date: string;
  vesselNameImo: string;
  port: string;
  eta: string;
  product: string;
  quantity: string;
  deliveryMode: string;
  agents: string;
  physicalSupplier: string;
  signatory: string;
  bn_to: string;
  bn_attn: string;
  bn_sellers: string;
  bn_suppliers: string;
  bn_buyingPrice: string;
  bn_paymentTerms: string;
  bn_remarks: string;
  oc_to: string;
  oc_attn: string;
  oc_buyers: string;
  oc_sellingPrice: string;
  oc_paymentTerms: string;
  oc_remarks: string;
}

/* -------------------------------------------------------------------------- */
/*  Styles — matched to the reference PDF                                     */
/* -------------------------------------------------------------------------- */
const s = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 10.5,
    color: "#1a1a1a",
    lineHeight: 1.45,
    paddingTop: 57,    // 20mm
    paddingBottom: 57,  // 20mm
    paddingLeft: 71,    // 25mm
    paddingRight: 57,   // 20mm
  },
  /* Header */
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 18,
  },
  logo: {
    height: 120,
    width: 120,
  },
  addressBlock: {
    textAlign: "right",
    fontSize: 9.5,
    lineHeight: 1.65,
    marginTop: 8,
  },
  /* Title */
  title: {
    textAlign: "center",
    fontSize: 12.5,
    marginBottom: 16,
    letterSpacing: 0.1,
  },
  /* Field rows */
  row: {
    flexDirection: "row",
    marginBottom: 3.5,
  },
  label: {
    fontFamily: "Helvetica-Bold",
    width: 130,
    flexShrink: 0,
    fontSize: 10.5,
  },
  sep: {
    width: 10,
    flexShrink: 0,
    fontSize: 10.5,
  },
  val: {
    flex: 1,
    fontSize: 10.5,
  },
  /* Tagline */
  tagline: {
    fontFamily: "Helvetica-Bold",
    fontSize: 10.5,
    marginTop: 13,
    marginBottom: 10,
  },
  /* Sub-text under vessel */
  subText: {
    fontSize: 10.5,
    color: "#444",
    marginLeft: 140,
    marginBottom: 2,
    lineHeight: 1.4,
  },
  subTextLast: {
    fontSize: 10.5,
    color: "#444",
    marginLeft: 140,
    marginBottom: 8,
    lineHeight: 1.4,
  },
  /* Spacer */
  spacer: { height: 7 },
  /* Regards */
  regards: { fontSize: 10.5, marginTop: 15 },
  signatory: { fontSize: 10.5, marginTop: 9 },
  /* Page 2 */
  notesTitle: {
    fontFamily: "Helvetica-Bold",
    fontSize: 10.5,
    textDecoration: "underline",
    marginBottom: 9,
  },
  note: {
    marginBottom: 7,
    fontSize: 9.8,
    lineHeight: 1.5,
  },
  noteBold: {
    fontFamily: "Helvetica-Bold",
    fontSize: 9.8,
  },
  remarksTitle: {
    fontFamily: "Helvetica-Bold",
    fontSize: 10.5,
    textDecoration: "underline",
    marginTop: 12,
    marginBottom: 6,
  },
  remark: {
    fontStyle: "italic",
    fontSize: 9.8,
    marginBottom: 4,
  },
  footer: {
    fontStyle: "italic",
    fontSize: 9,
    color: "#444",
    borderTopWidth: 1,
    borderTopColor: "#ccc",
    paddingTop: 9,
    marginTop: "auto",
    textAlign: "center",
  },
});

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                   */
/* -------------------------------------------------------------------------- */
function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={s.row}>
      <Text style={s.label}>{label}</Text>
      <Text style={s.sep}>:</Text>
      <Text style={s.val}>{value}</Text>
    </View>
  );
}

function Header({ withEmailPrefix }: { withEmailPrefix: boolean }) {
  return (
    <View style={s.header}>
      {/* eslint-disable-next-line jsx-a11y/alt-text */}
      <Image style={s.logo} src={ASEAN_LOGO} />
      <View style={s.addressBlock}>
        <Text>ASEAN INTERNATIONAL DMCC</Text>
        <Text>Unit No 2909</Text>
        <Text>JBC 1, Cluster G,</Text>
        <Text>Jumeirah Lake Towers,</Text>
        <Text>Dubai, U.A.E.</Text>
        <Text>{withEmailPrefix ? "EMAIL: bunkers@asean.ae" : "bunkers@asean.ae"}</Text>
      </View>
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/*  Page 1                                                                    */
/* -------------------------------------------------------------------------- */
function BNPage1(props: BunkerNominationDocumentProps) {
  const {
    date, vesselNameImo, port, eta, product, quantity, deliveryMode,
    agents, bn_to, bn_attn, bn_sellers, bn_suppliers, bn_buyingPrice,
    bn_paymentTerms, bn_remarks, signatory,
  } = props;

  return (
    <Page size="A4" style={s.page}>
      <Header withEmailPrefix={true} />

      <Text style={s.title}>Bunker Nomination</Text>

      <Row label="To" value={bn_to} />
      <Row label="Attn" value={bn_attn} />
      <Row label="Date" value={date} />

      <Text style={s.tagline}>
        We are pleased to place the following order confirmation with you:
      </Text>

      <Row label="Vessel:" value={vesselNameImo} />
      <Text style={s.subText}>
        AND/OR MASTER/ OWNERS/ CHARTERERS/ MANAGER/ OPERATORS/ AGENTS AND/OR
      </Text>
      <Text style={s.subTextLast}>ASEAN INTERNATIONAL DMCC</Text>

      <Row label="Port" value={port} />
      <Row label="ETA" value={eta} />
      <View style={s.spacer} />
      <Row label="Product" value={product} />
      <Row label="Quantity" value={quantity} />
      <Row label="Price" value={bn_buyingPrice} />
      <Row label="Delivery mode" value={deliveryMode} />
      <View style={s.spacer} />
      <Row label="Sellers" value={bn_sellers} />
      <Row label="Buyers" value="Asean International DMCC" />
      <Row label="Suppliers" value={bn_suppliers} />
      <View style={s.spacer} />
      <Row label="Agents" value={agents} />
      <View style={s.spacer} />
      <Row label="Payment" value={bn_paymentTerms} />
      <View style={s.spacer} />
      <Row label="Remarks" value={bn_remarks || "-"} />

      <Text style={s.regards}>Kind regards</Text>
      <Text style={s.signatory}>{signatory}</Text>
    </Page>
  );
}

/* -------------------------------------------------------------------------- */
/*  Page 2                                                                    */
/* -------------------------------------------------------------------------- */
function BNPage2() {
  return (
    <Page size="A4" style={s.page}>
      <Header withEmailPrefix={true} />

      <Text style={s.notesTitle}>NOTES</Text>

      <Text style={s.note}>
        Asean Operations contact (e-mail):{"   "}
        <Text style={s.noteBold}>Bunkers@asean.ae</Text>
      </Text>

      <Text style={s.note}>
        Please hand over the MSDS Sheet to the receving Vessel before bunkering
      </Text>

      <Text style={s.note}>
        Please confirm the good receipt of above email and immediately identify us of any errors else the same will be treated as correct & accepted by you
      </Text>

      <Text style={s.note}>
        The Seller/ Supplier warrants that the bunker to be supplied and / or the crude oil from which it is produced does not originate from Iran.
      </Text>

      <Text style={s.note}>
        Physical supplier to carry out a representative drip sampling into minimum 2 samples; One for the vessel and one for the supplier. In presence of representatives from both the supplier and vessel the sampling and the sealing has to be carried out and signed for
      </Text>

      <Text style={s.note}>
        The fuel oil must not contain any chemical waste and / or used marine - or automotive lubricants.{"\n"}The fuel must be proven to be homogeneous.
      </Text>

      <Text style={s.note}>
        Supplier is to keep close contact with the agents.
      </Text>

      <Text style={s.note}>
        Please forward your invoice and BDR not later then 05 working days from date of supply.
      </Text>

      <Text style={s.note}>
        All invoices and supporting receipts are to be emailed to the below given e-mail addresses:
      </Text>

      <Text style={s.note}>accounts@asean.ae and admin@asean.ae</Text>

      <Text style={s.remarksTitle}>REMARKS</Text>

      <Text style={s.remark}>
        -Sale is subject to BIMCO 2018 terms and conditions.
      </Text>

      <Text style={s.footer}>
        *Should you require a copy of our terms and conditions kindly request or visit our website at www.aseandmcc.com
      </Text>
    </Page>
  );
}

/* -------------------------------------------------------------------------- */
/*  Document                                                                  */
/* -------------------------------------------------------------------------- */
export default function BunkerNominationDocument(
  props: BunkerNominationDocumentProps
) {
  return (
    <Document>
      <BNPage1 {...props} />
      <BNPage2 />
    </Document>
  );
}
