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
 * Props for the OrderConfirmationDocument component.
 * Matches TransactionRecord minus _id and createdAt.
 */
export interface OrderConfirmationDocumentProps {
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
    paddingTop: 57,
    paddingBottom: 57,
    paddingLeft: 71,
    paddingRight: 57,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 18,
  },
  logo: {
    height: 95,
    width: 120,
  },
  addressBlock: {
    textAlign: "right",
    fontSize: 9.5,
    lineHeight: 1.65,
    marginTop: 8,
  },
  title: {
    textAlign: "center",
    fontSize: 12.5,
    marginBottom: 16,
    letterSpacing: 0.1,
  },
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
  tagline: {
    fontFamily: "Helvetica-Bold",
    fontSize: 10.5,
    marginTop: 13,
    marginBottom: 10,
  },
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
  spacer: { height: 7 },
  regards: { fontSize: 10.5, marginTop: 15 },
  signatory: { fontSize: 10.5, marginTop: 9 },
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

function Header() {
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
        <Text>bunkers@asean.ae</Text>
      </View>
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/*  Page 1                                                                    */
/* -------------------------------------------------------------------------- */
function OCPage1(props: OrderConfirmationDocumentProps) {
  const {
    date, vesselNameImo, port, eta, product, quantity, deliveryMode,
    agents, physicalSupplier, oc_to, oc_attn, oc_buyers, oc_sellingPrice,
    oc_paymentTerms, oc_remarks, signatory,
  } = props;

  return (
    <Page size="A4" style={s.page}>
      <Header />

      <Text style={s.title}>ORDER CONFIRMATION</Text>

      <Row label="To" value={oc_to} />
      <Row label="Attn" value={oc_attn} />
      <Row label="Date" value={date} />

      <Text style={s.tagline}>
        We are pleased to confirm the following nomination with you:
      </Text>

      <Row label="Vessel" value={vesselNameImo} />
      <Text style={s.subText}>
        AND/OR MASTER/ OWNERS/ CHARTERERS/ MANAGER/ OPERATORS/ AGENTS AND/OR
      </Text>
      <Text style={s.subTextLast}>{oc_buyers}</Text>

      <Row label="Port" value={port} />
      <Row label="ETA" value={eta} />
      <View style={s.spacer} />
      <Row label="Product" value={product} />
      <Row label="Quantity" value={quantity} />
      <Row label="Price" value={oc_sellingPrice} />
      <Row label="Delivery Mode" value={deliveryMode} />
      <View style={s.spacer} />
      <Row label="Sellers" value="Asean International DMCC" />
      <Row label="Buyers" value={oc_buyers} />
      <Row label="Supplier" value={physicalSupplier} />
      <View style={s.spacer} />
      <Row label="Agents" value={agents} />
      <View style={s.spacer} />
      <Row label="Remarks:" value={oc_remarks || ""} />
      <View style={s.spacer} />
      <Row label="Payment" value={oc_paymentTerms || ""} />

      <Text style={s.regards}>Kind regards</Text>
      <Text style={s.signatory}>{signatory}</Text>
    </Page>
  );
}

/* -------------------------------------------------------------------------- */
/*  Page 2 — text matched exactly to the reference OC PDF                     */
/* -------------------------------------------------------------------------- */
function OCPage2() {
  return (
    <Page size="A4" style={s.page}>
      <Header />

      <Text style={s.notesTitle}>NOTES</Text>

      <Text style={s.note}>
        Asean operations (e-mail):{"   "}bunkers@asean.ae
      </Text>

      <Text style={s.note}>
        Please confirm the good receipt of above email and immediately identify us of any errors else the same will be treated as correct & accepted by you
      </Text>

      <Text style={s.remarksTitle}>REMARKS</Text>

      <Text style={s.remark}>
        -Sale is subject to BIMCO 2018 terms and conditions
      </Text>
      <Text style={s.remark}>
        -Supply by barge is subject to weather condition.
      </Text>
      <Text style={s.remark}>
        -Supply barge sounding are final & binding to both parties.
      </Text>
      <Text style={s.remark}>
        -Cancellation charges applicable if the order is cancelled or reduction in Qty
      </Text>
      <Text style={s.remark}>
        -Kindly note for delay in payments received an Interest at 2% per calendar month or pro rata shall be levied from due-date
      </Text>
      <Text style={s.remark}>
        -The Seller/ Supplier warrants that the bunker to be supplied and / or the crude oil from which it is produced is not originating from Iran.
      </Text>

      <Text style={s.footer}>
        Should you require a copy of our terms and conditions kindly request or visit our website at www.aseandmcc.com
      </Text>
    </Page>
  );
}

/* -------------------------------------------------------------------------- */
/*  Document                                                                  */
/* -------------------------------------------------------------------------- */
export default function OrderConfirmationDocument(
  props: OrderConfirmationDocumentProps
) {
  return (
    <Document>
      <OCPage1 {...props} />
      <OCPage2 />
    </Document>
  );
}
