/**
 * FAQ Page Component
 * @module Pages
 * @group Public
 * 
 * This page displays a collection of frequently asked questions about the Campus Market platform
 * organized in an accordion format for easy browsing.
 */

import { Metadata } from "next";
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from "@/components/ui/accordion";

/**
 * Metadata for the FAQ page
 * Sets the page title and description for SEO purposes
 */
export const metadata: Metadata = {
  title: "FAQ - Campus Market",
  description: "Frequently Asked Questions about Campus Market and our services",
};

/**
 * FAQ Page Component
 * 
 * Renders an accordion-style list of frequently asked questions and their answers.
 * Each question is expandable/collapsible for better user experience.
 * 
 * @returns {JSX.Element} The rendered FAQ page
 */
export default function FAQPage() {
  return (
    <div className="container mx-auto py-12 px-4">
      <h1 className="text-4xl font-bold mb-8 text-center">Frequently Asked Questions</h1>
      
      <div className="max-w-3xl mx-auto">
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="item-1">
            <AccordionTrigger className="text-lg">
              How does Campus Market help students in dormitories?
            </AccordionTrigger>
            <AccordionContent>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-2">
            <AccordionTrigger className="text-lg">
              What types of services can I offer on the platform?
            </AccordionTrigger>
            <AccordionContent>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Fusce ullamcorper, urna in ultrices tincidunt, massa lacus interdum ligula, vel lacinia magna nibh nec turpis. Integer eu tellus vehicula, rhoncus nunc quis, finibus nisl. Maecenas commodo magna a diam sagittis, quis scelerisque magna imperdiet.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-3">
            <AccordionTrigger className="text-lg">
              How do I get paid for products I complete?
            </AccordionTrigger>
            <AccordionContent>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla facilisi. Praesent malesuada, mi eget convallis ultrices, nisi dui consectetur libero, vel luctus nulla mi id ligula. Phasellus non urna tellus. Praesent tincidunt arcu eget fermentum vehicula. Vivamus volutpat consectetur magna, vel rutrum sem finibus vitae.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-4">
            <AccordionTrigger className="text-lg">
              Is there a fee for using the platform?
            </AccordionTrigger>
            <AccordionContent>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Quisque eget purus a arcu laoreet tincidunt. Nullam tincidunt risus et turpis ullamcorper, ac malesuada nisi dictum. Ut elementum nunc vitae urna scelerisque, eget interdum mauris varius. In hac habitasse platea dictumst.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-5">
            <AccordionTrigger className="text-lg">
              How do I find products near me?
            </AccordionTrigger>
            <AccordionContent>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed euismod, mauris at ultrices eleifend, nisi eros tempor arcu, sed tempor enim nisl id velit. Nullam auctor, enim id condimentum ullamcorper, nunc felis tincidunt urna, quis rhoncus eros turpis id dui. Morbi volutpat, nisi in aliquet ultricies.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-6">
            <AccordionTrigger className="text-lg">
              How does the review system work?
            </AccordionTrigger>
            <AccordionContent>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Phasellus eleifend orci in magna sollicitudin, nec dictum sapien placerat. Donec vel metus vitae dolor viverra finibus. Suspendisse potenti. Suspendisse eu varius ex. Nulla facilisi. Donec dapibus orci eget sapien elementum, a placerat eros venenatis.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-7">
            <AccordionTrigger className="text-lg">
              Can I cancel a product I&apos;ve posted?
            </AccordionTrigger>
            <AccordionContent>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse ut tincidunt eros. Etiam vitae viverra metus. Nulla facilisi. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia curae; Etiam vehicula vitae neque sed bibendum. Maecenas vehicula leo sit amet elit pharetra, sit amet tincidunt metus ultrices.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-8">
            <AccordionTrigger className="text-lg">
              How do I report an issue with another user?
            </AccordionTrigger>
            <AccordionContent>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam vitae lacus vel turpis fermentum gravida. Suspendisse eget mauris magna. Suspendisse potenti. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia curae; Suspendisse aliquam aliquam ante, sit amet molestie odio vehicula in.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-9">
            <AccordionTrigger className="text-lg">
              Is my personal information secure?
            </AccordionTrigger>
            <AccordionContent>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Proin consequat, ligula ut sagittis lacinia, sapien enim tempus odio, a efficitur ex ligula et enim. Sed volutpat sem ac dui pulvinar, vitae pulvinar arcu blandit. Aenean elementum suscipit lorem. Aenean vitae est cursus, fringilla enim at, consectetur sem.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-10">
            <AccordionTrigger className="text-lg">
              How can I contact customer support?
            </AccordionTrigger>
            <AccordionContent>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Mauris vitae rutrum quam. Nullam volutpat odio id justo molestie, eget ultrices metus egestas. Integer interdum, felis a consequat dignissim, eros mi gravida mauris, vitae faucibus arcu ante at tellus. Mauris et felis quis nibh pharetra bibendum.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </div>
  );
} 
