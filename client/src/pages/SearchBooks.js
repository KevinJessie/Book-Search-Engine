/* eslint-disable react/jsx-no-undef */
import React, { useState, useEffect } from 'react';
import {  Container, Form, Button, Row, Col, Card } from 'react-bootstrap';
import Auth from '../utils/auth';
import { SAVE_BOOK } from '../utils/mutations';
import { saveBookIds, getSavedBookIds } from '../utils/localStorage';
import { useMutation } from '@apollo/client';

const SearchBooks = () => {
  // create state for holding returned google api data
  const [searchedBooks, setSearchedBooks] = useState([]);
  // create state for holding our search field data
  const [searchInput, setSearchInput] = useState('');

  // create state to hold saved bookId values
  const [savedBookIds, setSavedBookIds] = useState(getSavedBookIds());

  // set up useEffect hook to save `savedBookIds` list to localStorage on component unmount
  // learn more here: https://reactjs.org/docs/hooks-effect.html#effects-with-cleanup
  useEffect(() => {
    return () => saveBookIds(savedBookIds);
  });

  // create method to search for books and set state on form submit
  const handleFormSubmit = async (event) => {
    event.preventDefault();
    if (!searchInput) {
      return false;
    }
    try {
      const response = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${searchInput}`);
      if (!response.ok) {
        throw new Error('something went wrong!');
      }
      const { items } = await response.json();
      console.log(items);
      const bookData = items.map((book) => ({
        bookId: book.id,
        authors: book.volumeInfo.authors || ['No author to display'],
        title: book.volumeInfo.title,
        description: book.volumeInfo.description,
        image: book.volumeInfo.imageLinks?.thumbnail || '',
        link: book.volumeInfo.infoLink,
      }));
      setSearchedBooks(bookData);
      setSearchInput('');
    } catch (err) {
      console.error(err);
    }
  };
  // create function to handle saving a book to our database
  const [saveBook, { error }] = useMutation(SAVE_BOOK);
  // create function that accepts the book's mongo _id value as param and deletes the book from the database
  const handleSaveBook = async (bookId) => {
    // find the book in `searchedBooks` state by the matching id
    const bookToSave = searchedBooks.find((book) => book.bookId === bookId);
    console.log(bookToSave);
    // get token
    const token = Auth.loggedIn() ? Auth.getToken() : null;
    if (!token) {
      return false;
    }
    try {
      await saveBook({
        variables: { bookData: { ...bookToSave } },
      });
      if (error) {
        throw new Error('something went wrong!');
      }
      // if book successfully saves to user's account, save book id to state
      setSavedBookIds([...savedBookIds, bookToSave.bookId]);
    } catch (err) {
      console.error(err);
    }
  };
  
  return (
    <>
      <Jumbotron fluid className='text-light bg-dark'>
        <Container>
          <h1>Search for Books with GoogleBooks</h1>
          <Form onSubmit={handleFormSubmit}>
            <Form.Group>
              <Form.Label htmlFor='searchInput'>Search:</Form.Label>
              <Form.Control
                name='searchInput'
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                type='text'
                placeholder='Search for a book'
              />
            </Form.Group>
            <Button type='submit' variant='success'>
              Submit Search
            </Button>
          </Form>
        </Container>
      </Jumbotron>
      <Container>
        <h2>
          {searchedBooks.length
            ? `Viewing ${searchedBooks.length} results:`
            : 'Search for a book to begin'}
        </h2>
        <Row>
          {searchedBooks.map((book) => {
            return (
              <Col xs={12} md={6} lg={4} key={book.bookId}>
                <Card>
                  {book.image ? <Card.Img src={book.image} alt={`The cover for ${book.title}`} variant='top' /> : null}
                  <Card.Body>
                    <Card.Title>{book.title}</Card.Title>
                    <p className='small'>Authors: {book.authors}</p>
                    <Card.Text>{book.description}</Card.Text>
                    <Button
                      className='btn-block btn-info'
                      href={book.link}
                      target='_blank'
                      rel='noopener noreferrer'
                    >
                      View Book
                    </Button>
                    <Button
                      className='btn-block btn-success'
                      disabled={savedBookIds?.some((savedBookId) => savedBookId === book.bookId)}
                      onClick={() => handleSaveBook(book.bookId)}
                    >
                      {savedBookIds?.some((savedBookId) => savedBookId === book.bookId)
                        ? 'This book has already been saved!'
                        : 'Save this Book!'}
                    </Button>
                  </Card.Body>
                </Card>
              </Col>
            );
          })}
        </Row>
      </Container>
    </>
  );
};



export default SearchBooks;
