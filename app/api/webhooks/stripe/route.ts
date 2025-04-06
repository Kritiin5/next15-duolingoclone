import Stripe from "stripe";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

import db from "@/db/drizzle";
import { eq } from "drizzle-orm";
import { stripe } from "@/lib/stripe";
import { userSubscription } from "@/db/schema";

interface InvoiceWithSubscription extends Stripe.Invoice {
  subscription: string;
}

export async function POST(req: Request) {
  const body = await req.text();
  const signature = (await headers()).get("Stripe-Signature") as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!,
    );
  } catch (error) {
    if (error instanceof Error) {
      return new NextResponse(`Webhook error: ${error.message}`, {
        status: 400,
      });
    }
    return new NextResponse(`Webhook error`, { status: 400 });
  }

  const session = event.data.object as Stripe.Checkout.Session;

  if (event.type === "checkout.session.completed") {
    const subscription = await stripe.subscriptions.retrieve(
      session.subscription as string
    ) as Stripe.Subscription;

    if (!session?.metadata?.userId) {
      return new NextResponse("User ID is required", { status: 400 });
    }

    await db.insert(userSubscription).values({
      userId: session.metadata.userId,
      stripeSubscriptionId: subscription.id,
      stripeCustomerId: subscription.customer as string,
      stripePriceId: subscription.items.data[0].price.id,
      stripeCurrentPeriodEnd: new Date(
        subscription.items.data[0].current_period_end * 1000,
      ),
    });
  }

  if (event.type === "invoice.payment_succeeded") {
    const invoice = event.data.object as InvoiceWithSubscription;

    if (!invoice.subscription) {
      console.error("No subscription ID found in the invoice.");
      return new NextResponse("No subscription ID found", { status: 400 });
    }

    const subscription = await stripe.subscriptions.retrieve(invoice.subscription) as Stripe.Subscription;

    await db.update(userSubscription).set({
      stripePriceId: subscription.items.data[0].price.id,
      stripeCurrentPeriodEnd: new Date(subscription.items.data[0].current_period_end * 1000),
    }).where(eq(userSubscription.stripeSubscriptionId, subscription.id));
  }

  return new NextResponse(null, { status: 200 });
}
