import { addPublicationJsonLd } from '@starter-kit/utils/seo/addPublicationJsonLd';
import { getAutogeneratedPublicationOG } from '@starter-kit/utils/social/og';
import request from 'graphql-request';
import { GetStaticProps } from 'next';
import Head from 'next/head';
import { useState } from 'react';
import { Waypoint } from 'react-waypoint';
import { Button } from '../components/button';
import { Container } from '../components/container';
import { AppProvider } from '../components/contexts/appContext';
import { Footer } from '../components/footer';
import { Header } from '../components/header';
import { ArticleSVG, ChevronDownSVG } from '../components/icons';
import { Layout } from '../components/layout';
import { Navbar } from '../components/navbar';
import { SubscribeForm } from '../components/subscribe-form';
import VerticalTimeline from '../components/vertical-timeline';
import {
	MorePostsByPublicationDocument,
	MorePostsByPublicationQuery,
	MorePostsByPublicationQueryVariables,
	PageInfo,
	PostFragment,
	PostsByPublicationDocument,
	PostsByPublicationQuery,
	PostsByPublicationQueryVariables,
	PublicationFragment,
} from '../generated/graphql';

const GQL_ENDPOINT = process.env.NEXT_PUBLIC_HASHNODE_GQL_ENDPOINT;

type Props = {
	publication: PublicationFragment;
	initialAllPosts: PostFragment[];
	initialPageInfo: PageInfo;
};

export default function Index({ publication, initialAllPosts, initialPageInfo }: Props) {
	const [allPosts, setAllPosts] = useState<PostFragment[]>(initialAllPosts);
	const [pageInfo, setPageInfo] = useState<Props['initialPageInfo']>(initialPageInfo);
	const [loadedMore, setLoadedMore] = useState(false);

	const loadMore = async () => {
		const data = await request<MorePostsByPublicationQuery, MorePostsByPublicationQueryVariables>(
			GQL_ENDPOINT,
			MorePostsByPublicationDocument,
			{
				first: 5,
				host: process.env.NEXT_PUBLIC_HASHNODE_PUBLICATION_HOST,
				after: pageInfo.endCursor,
			},
		);
		if (!data.publication) {
			return;
		}
		const newPosts = data.publication.posts.edges.map((edge) => edge.node);
		setAllPosts([...allPosts, ...newPosts]);
		setPageInfo(data.publication.posts.pageInfo);
		setLoadedMore(true);
	};

	const morePosts = allPosts.slice(7);

	return (
		<AppProvider publication={publication}>
			<Layout>
				<Head>
					<title>
						{publication.displayTitle || publication.title || 'Hashnode Blog Starter Kit'}
					</title>
					<meta
						name="description"
						content={
							publication.descriptionSEO || publication.title || `${publication.author.name}'s Blog`
						}
					/>
					<meta property="twitter:card" content="summary_large_image" />
					<meta
						property="twitter:title"
						content={publication.displayTitle || publication.title || 'Hashnode Blog Starter Kit'}
					/>
					<meta
						property="twitter:description"
						content={
							publication.descriptionSEO || publication.title || `${publication.author.name}'s Blog`
						}
					/>
					<meta
						property="og:image"
						content={publication.ogMetaData.image || getAutogeneratedPublicationOG(publication)}
					/>
					<meta
						property="twitter:image"
						content={publication.ogMetaData.image || getAutogeneratedPublicationOG(publication)}
					/>
					<script
						type="application/ld+json"
						dangerouslySetInnerHTML={{
							__html: JSON.stringify(addPublicationJsonLd(publication)),
						}}
					/>
				</Head>
				<Header />
				<Container className="flex flex-col items-stretch gap-10 px-5 pb-10 bg-gradient-to-r from-white via-indigo-100 to-white dark:bg-gradient-to-r dark:from-zinc-950 dark:via-zinc-800 dark:to-zinc-950">
					<Navbar />
					<SubscribeForm />
					{allPosts.length === 0 && (
						<div className="grid grid-cols-1 py-20 lg:grid-cols-3">
							<div className="flex flex-col items-center col-span-1 gap-5 text-center text-slate-700 dark:text-neutral-400 lg:col-start-2">
								<div className="w-20">
									<ArticleSVG clasName="stroke-current" />
								</div>
								<p className="text-xl font-semibold ">
									Hang tight! We&apos;re drafting the first article.
								</p>
							</div>
						</div>
					)}

					<div className="relative space-y-10 sm:ml-[calc(2rem+1px)] sm:pb-12 md:ml-[max(calc(14.5rem+1px),calc(100%-48rem))]">
						<div className="absolute bottom-0 right-full top-3 mr-7 hidden w-px bg-slate-200 dark:bg-slate-800 sm:block md:mr-[3.25rem]" />
						<VerticalTimeline posts={allPosts} />
					</div>
					{morePosts.length > 0 && (
						<>
							{!loadedMore && pageInfo.hasNextPage && pageInfo.endCursor && (
								<div className="flex flex-row items-center justify-center w-full">
									<Button
										onClick={loadMore}
										type="outline"
										icon={<ChevronDownSVG className="w-5 h-5 stroke-current" />}
										label="Load more posts"
									/>
								</div>
							)}
							{loadedMore && pageInfo.hasNextPage && pageInfo.endCursor && (
								<Waypoint onEnter={loadMore} bottomOffset={'10%'} />
							)}
						</>
					)}
				</Container>
				<Footer />
			</Layout>
		</AppProvider>
	);
}

export const getStaticProps: GetStaticProps<Props> = async () => {
	const data = await request<PostsByPublicationQuery, PostsByPublicationQueryVariables>(
		GQL_ENDPOINT,
		PostsByPublicationDocument,
		{
			first: 10,
			host: process.env.NEXT_PUBLIC_HASHNODE_PUBLICATION_HOST,
		},
	);

	const publication = data.publication;
	if (!publication) {
		return {
			notFound: true,
		};
	}
	const initialAllPosts = publication.posts.edges.map((edge) => edge.node);
	return {
		props: {
			publication,
			initialAllPosts,
			initialPageInfo: publication.posts.pageInfo,
		},
		revalidate: 1,
	};
};
