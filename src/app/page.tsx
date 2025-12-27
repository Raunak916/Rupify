import HeroSection from "@/components/hero";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  featuresData,
  howItWorksData,
  statsData,
  testimonialsData,
} from "@/data/landing";
import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="mt-40">
      <HeroSection />

      <section className="py-20 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {statsData.map((item, index) => (
              <div key={index} className="text-center">
                <div className="mb-2 text-4xl font-bold text-primary">
                  {item.value}
                </div>
                <div className="text-muted-foreground">{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="mb-12 text-center text-3xl font-bold">
            Everything you need to manage your money.
          </h2>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {featuresData.map((feature, index) => (
              <Card key={index} className="transition hover:shadow-lg">
                <CardContent className="space-y-4 pt-6">
                  <div className="text-primary">{feature.icon}</div>
                  <h3 className="text-xl font-semibold">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-muted/50">
        <div className="container mx-auto px-4">
          <h2 className="mb-12 text-center text-3xl font-bold">
            How it works.
          </h2>

          <div className="grid gap-8 md:grid-cols-3">
            {howItWorksData.map((step, index) => (
              <div key={index} className="text-center">
                <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                  {step.icon}
                </div>
                <h3 className="mb-4 text-xl font-semibold">{step.title}</h3>
                <p className="text-muted-foreground">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="mb-12 text-center text-3xl font-bold">
            What our users say.
          </h2>

          <div className="grid gap-8 md:grid-cols-3">
            {testimonialsData.map((testimonial, index) => (
              <Card key={index} className="transition hover:shadow-lg">
                <CardContent className="pt-6">
                  <div className="mb-4 flex items-center">
                    <Image
                      src={testimonial.image}
                      alt={testimonial.name}
                      width={40}
                      height={40}
                      className="rounded-full"
                    />
                    <div className="ml-4">
                      <div className="font-semibold">{testimonial.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {testimonial.role}
                      </div>
                    </div>
                  </div>
                  <p className="text-muted-foreground">{testimonial.quote}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="mb-4 text-3xl font-bold">
            Ready to take control of your finances?
          </h2>

          <p className="mx-auto mb-8 max-w-2xl text-primary-foreground/80">
            Join thousands of users who are already managing their finances
            smarter with Rupify.
          </p>

          <Link href="/dashboard">
            <Button size="lg" variant="secondary" className="px-8">
              Start free trial
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
