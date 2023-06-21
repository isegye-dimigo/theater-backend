interface PageQuery {
	'page[size]': number;
	'page[index]': number;
	'page[order]': 'desc' | 'asc';
}