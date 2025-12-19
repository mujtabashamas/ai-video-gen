export interface VideoGenInput {
  avatarImage: string;    // Path to avatar image
  productImage: string;   // Path to product image
  product: string;        // Product name
  description: string;    // Product description
}

export interface VideoGenOutput {
  runId: string;
  compositeImage: string;
  script: string;
  finalVideo: string;
}

